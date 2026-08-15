type Announcement = {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji: string;
  bg_color: string;
  text_color: string;
};

export default function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div
      className="col-span-2 md:col-span-3 lg:col-span-4 rounded-2xl overflow-hidden relative"
      style={{ background: announcement.bg_color, color: announcement.text_color }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative px-6 py-8 flex flex-col items-center text-center">
        <span className="text-4xl mb-3">{announcement.emoji}</span>
        <h2 className="text-xl md:text-2xl font-bold leading-tight">{announcement.title}</h2>
        {announcement.subtitle && (
          <p className="mt-1.5 text-sm opacity-80 max-w-sm">{announcement.subtitle}</p>
        )}
      </div>
    </div>
  );
}