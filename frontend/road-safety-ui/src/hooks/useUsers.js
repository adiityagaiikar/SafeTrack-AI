import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('fullname', 'asc'));

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map fields to match UI expectations if necessary
        name: doc.data().fullname || doc.data().name || 'Unknown',
        email: doc.data().email || 'No Email',
        role: doc.data().role || (doc.data().is_admin ? 'Admin' : 'Operator'),
        status: doc.data().status || 'Active',
        lastLogin: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()).toLocaleString() : 'Never',
        joinDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString() : 'N/A',
      }));
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading, error };
}
