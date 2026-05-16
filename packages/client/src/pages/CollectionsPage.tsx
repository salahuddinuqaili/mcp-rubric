import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function CollectionsPage() {
  const { collections, loading, fetchAll, create, remove } = useCollectionsStore();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await create(newName.trim(), newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Collection</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="coll-name">Name</Label>
                <Input
                  id="coll-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My API tests"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coll-desc">Description (optional)</Label>
                <Input
                  id="coll-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="A collection of test calls"
                />
              </div>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : collections.length === 0 ? (
        <p className="text-muted-foreground">No collections yet. Create one to save requests.</p>
      ) : (
        <div className="space-y-3">
          {collections.map((coll) => (
            <Card key={coll.id}>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link to={`/collections/${coll.id}`} className="hover:underline">
                    {coll.name}
                  </Link>
                  <Badge variant="secondary" className="text-xs">
                    {coll.items.length} items
                  </Badge>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-auto text-destructive"
                    onClick={() => remove(coll.id)}
                  >
                    Delete
                  </Button>
                </CardTitle>
              </CardHeader>
              {coll.description && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground">{coll.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
