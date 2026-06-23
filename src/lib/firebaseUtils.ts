import { query, QueryConstraint, CollectionReference, where } from 'firebase/firestore';
import { auth } from '../firebase/config';

/**
 * Creates a Firestore query scoped to the current user.
 * If no user is logged in, it defaults to 'guest' scope for demo purposes.
 */
export function createScopedQuery(collectionRef: CollectionReference, ...constraints: QueryConstraint[]) {
  const userId = auth.currentUser?.uid || 'guest';
  return query(collectionRef, where('userId', '==', userId), ...constraints);
}
