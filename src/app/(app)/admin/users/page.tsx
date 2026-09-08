import { notFound } from "next/navigation";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, TEAMS, TEAM_LABELS, ROLE_LABELS } from "@/lib/teams";
import { addUser, updateUser, toggleUserActive } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireUser();
  if (!isAdmin(me)) notFound();

  const users = await prisma.user.findMany({ orderBy: [{ team: "asc" }, { email: "asc" }] });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">Who can sign in, and which team's tools they see.</p>
      </div>

      <form action={addUser} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_160px_130px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="name@providentestate.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="name" name="name" placeholder="Filled from Google on first sign-in" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team">Team</Label>
          <Select id="team" name="team" defaultValue="AGENTS">
            {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABELS[t]}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="MEMBER">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
        <Button type="submit">Add</Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isMe = u.id === me.id;
            const update = updateUser.bind(null, u.id);
            return (
              <TableRow key={u.id} className={u.active ? "" : "opacity-60"}>
                <TableCell>
                  <p className="font-medium">{u.name ?? "—"}{isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </TableCell>
                <TableCell>
                  <form action={update} id={`u-${u.id}`} className="contents">
                    <Select name="team" defaultValue={u.team} className="w-44" disabled={!u.active}>
                      {TEAMS.map((t) => <option key={t} value={t}>{TEAM_LABELS[t]}</option>)}
                    </Select>
                  </form>
                </TableCell>
                <TableCell>
                  <Select name="role" form={`u-${u.id}`} defaultValue={u.role} className="w-28" disabled={!u.active || isMe}>
                    {(["MEMBER", "ADMIN"] as const).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </Select>
                </TableCell>
                <TableCell>{u.active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge>}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button type="submit" form={`u-${u.id}`} size="sm" variant="outline" disabled={!u.active}>Save</Button>
                    {!isMe && (
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <Button type="submit" size="sm" variant="ghost">{u.active ? "Disable" : "Enable"}</Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
