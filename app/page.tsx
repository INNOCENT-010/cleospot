import MealsGrid from "@/components/MealsGrid";
import CategoryNav from "@/components/CategoryNav";
import HeroVideo from "@/components/HeroVideo";
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 30;

async function getMeals() {
  const { data } = await supabaseAdmin
    .from("meals")
    .select("*, categories(id, name, emoji)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  return data || [];
}

async function getCategories() {
  const { data } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

async function getHeroVideos() {
  const { data } = await supabaseAdmin
    .from("hero_videos")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

async function getAnnouncements() {
  const { data } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function HomePage() {
  const [meals, categories, videos, announcements] = await Promise.all([
    getMeals(), getCategories(), getHeroVideos(), getAnnouncements()
  ]);

  return (
    <>
      {/* Hero — pulls up behind fixed header */}
      <div className="-mt-[73px]">
      {videos.length > 0 ? (
        <HeroVideo videos={videos} />
      ) : (
        <section className="relative overflow-hidden bg-[#1a0a00]">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(227,6,19,0.18),transparent)]" />
          <div className="relative max-w-6xl mx-auto px-4 py-14 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#e8a87c] font-medium mb-3">
              Fresh · Home-cooked · Ready now
            </p>
            <h1 className="brand-script text-5xl md:text-6xl text-white leading-tight mb-4">
              Today&apos;s Plates
            </h1>
            <p className="text-[#c9a98a] text-sm md:text-base max-w-md mx-auto">
              Made with care, packed with flavour — order your favourite Nigerian meal delivered straight to you.
            </p>
          </div>
        </section>
      )}
      </div>

      {/* Meals section */}
      <section
        className="relative min-h-screen"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 10% 20%, rgba(227,6,19,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 80%, rgba(200,80,20,0.07) 0%, transparent 60%),
            #fdf8f3
          `,
        }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-20" />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e8c4a0]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#b07040]">
              {meals.length} {meals.length === 1 ? "meal" : "meals"} available
            </span>
            <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e8c4a0]" />
          </div>

          {categories.length > 0 && <CategoryNav categories={categories} />}

          <MealsGrid meals={meals} categories={categories} announcements={announcements} />
        </div>
      </section>
    </>
  );
}