import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const MAX_QUEUE_SIZE = 20;
const QUEUE_TIMEOUT_MINUTES = 10;

interface JoinQueueResult {
  position: number;
  sessionId: string;
}

/**
 * Agregar un cliente a la cola FIFO del local
 */
export async function joinQueue(
  userId: string,
  sessionId: string,
  clientIP?: string
): Promise<JoinQueueResult> {
  const queueRef = db.collection('queues').doc(userId);
  const clientRef = queueRef.collection('clients').doc(sessionId);

  return db.runTransaction(async (transaction) => {
    const queueDoc = await transaction.get(queueRef);
    
    // Inicializar cola si no existe
    if (!queueDoc.exists) {
      transaction.set(queueRef, {
        currentCount: 0,
        lastPosition: 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const queueData = queueDoc.data() || { currentCount: 0, lastPosition: 0 };

    // Verificar límite de cola
    if (queueData.currentCount >= MAX_QUEUE_SIZE) {
      throw new Error('Queue is full. Please try again later.');
    }

    // Asignar nueva posición
    const newPosition = queueData.lastPosition + 1;

    // Crear documento del cliente
    transaction.set(clientRef, {
      sessionId,
      position: newPosition,
      joinedAt: FieldValue.serverTimestamp(),
      lastActivity: FieldValue.serverTimestamp(),
      status: 'waiting',
      clientIP: clientIP || null,
    });

    // Actualizar contador de cola
    transaction.update(queueRef, {
      currentCount: FieldValue.increment(1),
      lastPosition: newPosition,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      position: newPosition,
      sessionId,
    };
  });
}

/**
 * Actualizar la actividad del cliente en la cola (heartbeat)
 */
export async function updateActivity(
  userId: string,
  sessionId: string
): Promise<void> {
  const clientRef = db
    .collection('queues')
    .doc(userId)
    .collection('clients')
    .doc(sessionId);

  await clientRef.update({
    lastActivity: FieldValue.serverTimestamp(),
  });
}

/**
 * Remover un cliente de la cola y reposicionar a los demás
 */
export async function removeFromQueue(
  userId: string,
  sessionId: string
): Promise<void> {
  const queueRef = db.collection('queues').doc(userId);
  const clientRef = queueRef.collection('clients').doc(sessionId);

  await db.runTransaction(async (transaction) => {
    const clientDoc = await transaction.get(clientRef);
    
    if (!clientDoc.exists) {
      return; // Cliente ya no está en la cola
    }

    const clientData = clientDoc.data();
    const removedPosition = clientData?.position;

    // Eliminar el cliente
    transaction.delete(clientRef);

    // Obtener todos los clientes con posición mayor
    const clientsSnapshot = await queueRef
      .collection('clients')
      .where('position', '>', removedPosition)
      .orderBy('position', 'asc')
      .get();

    // Reposicionar clientes
    clientsSnapshot.forEach((doc) => {
      const newPosition = doc.data().position - 1;
      transaction.update(doc.ref, { position: newPosition });
    });

    // Actualizar contador
    transaction.update(queueRef, {
      currentCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Limpiar clientes expirados de la cola (ejecutado por Cloud Scheduler)
 */
export async function cleanupExpiredClients(): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const timeoutThreshold = new Date(
    now.toMillis() - QUEUE_TIMEOUT_MINUTES * 60 * 1000
  );

  const queuesSnapshot = await db.collection('queues').get();

  for (const queueDoc of queuesSnapshot.docs) {
    const userId = queueDoc.id;
    const clientsSnapshot = await queueDoc.ref
      .collection('clients')
      .where('lastActivity', '<', timeoutThreshold)
      .where('status', 'in', ['waiting', 'active'])
      .get();

    // Remover clientes expirados
    for (const clientDoc of clientsSnapshot.docs) {
      const sessionId = clientDoc.id;
      await clientDoc.ref.update({ status: 'expired' });
      await removeFromQueue(userId, sessionId);
    }
  }
}

import * as admin from 'firebase-admin';
