'use client';

interface Participant {
  userId: string;
  displayName: string;
  role: string;
}

interface Props {
  participants: Participant[];
}

export default function ParticipantList({ participants }: Props) {
  return (
    <div className="p-2">
      <h3 className="mb-2 text-sm font-medium text-gray-400">Participants</h3>
      <ul className="space-y-1">
        {participants.map((p) => (
          <li key={p.userId} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {p.displayName} <span className="text-gray-500">({p.role})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
