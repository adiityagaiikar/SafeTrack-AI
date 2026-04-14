import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

const DEFAULT_NODES = [
  { id: "NODE-ALPHA", loc: "Thane West",    status: "Online",  latency: "12ms",  uptime: "99.9%" },
  { id: "NODE-BETA",  loc: "Mumbai Hwy",    status: "Warning", latency: "145ms", uptime: "98.2%" },
  { id: "NODE-GAMMA", loc: "Pune Exp",      status: "Offline", latency: "—",     uptime: "81.4%" },
  { id: "NODE-DELTA", loc: "Navi Mumbai",   status: "Online",  latency: "8ms",   uptime: "99.7%" },
];

export function useEdgeNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nodesRef = collection(db, 'edge_nodes');
    
    const unsubscribe = onSnapshot(nodesRef, async (snapshot) => {
      if (snapshot.empty) {
        // Initialize with default nodes if empty
        for (const node of DEFAULT_NODES) {
          await setDoc(doc(db, 'edge_nodes', node.id), {
            ...node,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        const nodesData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setNodes(nodesData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { nodes, loading };
}
