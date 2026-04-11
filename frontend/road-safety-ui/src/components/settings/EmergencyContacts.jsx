import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/context/AuthContext";

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const MAX_CONTACTS = 3;

export default function EmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const userRef = useMemo(() => {
    if (!user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [user?.uid]);

  useEffect(() => {
    const load = async () => {
      if (!userRef) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const stored = (snap.data()?.emergencyContacts || []).slice(0, MAX_CONTACTS);
          setContacts(stored.length > 0 ? stored : [""]);
        } else {
          await setDoc(userRef, { emergencyContacts: [] }, { merge: true });
          setContacts([""]);
        }
      } catch (error) {
        setMessage(error?.message || "Failed to load emergency contacts.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userRef]);

  const onChangeContact = (index, value) => {
    setContacts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addContactField = () => {
    setContacts((prev) => {
      if (prev.length >= MAX_CONTACTS) return prev;
      return [...prev, ""];
    });
  };

  const removeContactField = (index) => {
    setContacts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const saveContacts = async () => {
    if (!userRef || saving) return;
    setMessage("");

    const cleaned = contacts.map((item) => item.trim()).filter(Boolean).slice(0, MAX_CONTACTS);
    const invalid = cleaned.find((item) => !E164_PATTERN.test(item));

    if (invalid) {
      setMessage(`Invalid number format: ${invalid}. Use E.164 format like +14155552671.`);
      return;
    }

    try {
      setSaving(true);
      await setDoc(userRef, { emergencyContacts: cleaned }, { merge: true });
      setContacts(cleaned.length > 0 ? cleaned : [""]);
      setMessage("Emergency contacts saved successfully.");
    } catch (error) {
      setMessage(error?.message || "Failed to save emergency contacts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-50" />
      <CardHeader className="bg-black/60 border-b border-white/5 pb-6 pt-8 px-10 backdrop-blur-xl z-10 relative">
        <CardTitle className="text-2xl font-black tracking-tight text-white">Manage Emergency Contacts</CardTitle>
        <CardDescription className="text-zinc-500 font-medium text-base">
          Add up to 3 phone numbers in E.164 format for SOS dispatch.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-10 space-y-5 bg-[#050505]/80 backdrop-blur-md relative z-10">
        {loading ? (
          <div className="text-zinc-400 text-sm">Loading emergency contacts...</div>
        ) : (
          <>
            {contacts.map((contact, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">
                    Contact #{index + 1}
                  </Label>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-zinc-400 hover:text-red-300"
                      onClick={() => removeContactField(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  value={contact}
                  onChange={(e) => onChangeContact(index, e.target.value)}
                  placeholder="+14155552671"
                  className="bg-black/50 border-white/10 shadow-inner h-12 px-4 rounded-xl font-mono text-zinc-300"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={addContactField}
                disabled={contacts.length >= MAX_CONTACTS}
                className="rounded-full border-white/20 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Contact
              </Button>

              <Button
                onClick={saveContacts}
                disabled={saving}
                className="bg-white hover:bg-zinc-200 text-zinc-950 rounded-full px-8 font-bold"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Contacts"}
              </Button>
            </div>

            {message && (
              <div className="rounded-md border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
                {message}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
