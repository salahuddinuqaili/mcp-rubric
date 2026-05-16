import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollectionsStore } from "@/stores/collections-store";
import type { CollectionItem } from "@mcp-studio/shared";
import { useEffect, useState } from "react";

interface SaveToCollectionDialogProps {
  item: CollectionItem;
}

export function SaveToCollectionDialog({ item }: SaveToCollectionDialogProps) {
  const { collections, fetchAll, create, addItem } = useCollectionsStore();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  const handleSaveToExisting = async (collectionId: string) => {
    setSaving(true);
    await addItem(collectionId, item);
    setSaving(false);
    setOpen(false);
  };

  const handleCreateAndSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const collection = await create(newName.trim());
    await addItem(collection.id, item);
    setSaving(false);
    setNewName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Save to Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {collections.length > 0 && (
            <div className="space-y-2">
              <Label>Existing collections</Label>
              <div className="space-y-1 max-h-40 overflow-auto">
                {collections.map((coll) => (
                  <Button
                    key={coll.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    disabled={saving}
                    onClick={() => handleSaveToExisting(coll.id)}
                  >
                    {coll.name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {coll.items.length} items
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-coll">Or create new</Label>
            <div className="flex gap-2">
              <Input
                id="new-coll"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
              />
              <Button onClick={handleCreateAndSave} disabled={!newName.trim() || saving}>
                Create
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
