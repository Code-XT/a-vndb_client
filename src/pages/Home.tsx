import React, { useEffect, useState } from "react";
import { queryVNs } from "../services/vndbService";
import { VN } from "../types";
import { VNCard, VNCardSkeleton } from "../components/VNCard";
import { motion } from "motion/react";
import { TrendingUp, Star, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const VNRow: React.FC<{
  title: string;
  icon: React.ElementType;
  vns: VN[];
  loading: boolean;
  sortParam: string;
}> = ({ title, icon: Icon, vns, loading, sortParam }) => (
  <section className="mb-7">
    <div className="flex justify-between items-center mb-3 px-4 md:px-6">
      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Icon size={14} className="text-indigo-500" />
        {title}
      </h2>
      <Link
        to={`/search?sort=${sortParam}`}
        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-0.5 transition-colors"
      >
        See all <ArrowRight size={11} />
      </Link>
    </div>
    <div className="flex overflow-x-auto gap-3 pb-3 px-4 md:px-6 scrollbar-hide snap-x snap-mandatory">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-32 md:w-36 flex-shrink-0 snap-start">
              <VNCardSkeleton />
            </div>
          ))
        : vns.map((vn) => (
            <div key={vn.id} className="w-32 md:w-36 flex-shrink-0 snap-start">
              <VNCard vn={vn} />
            </div>
          ))}
    </div>
  </section>
);

export const Home: React.FC = () => {
  const [topRated, setTopRated] = useState<VN[]>([]);
  const [popular, setPopular] = useState<VN[]>([]);
  const [latest, setLatest] = useState<VN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [topData, popData, latestData] = await Promise.all([
          queryVNs({ sort: "rating", reverse: true, results: 10 }),
          queryVNs({ sort: "votecount", reverse: true, results: 10 }),
          queryVNs({ sort: "released", reverse: true, results: 10 }),
        ]);
        setTopRated(topData.results);
        setPopular(popData.results);
        setLatest(latestData.results);
      } catch {
        setError("Failed to load. Check your connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-8"
    >
      {/* Header */}
      <div className="px-4 md:px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Discover</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Explore the world of visual novels.
        </p>
      </div>

      {error && (
        <div className="mx-4 md:mx-6 mb-5 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <VNRow
        title="Latest Releases"
        icon={Clock}
        vns={latest}
        loading={loading}
        sortParam="released"
      />
      <VNRow
        title="Most Popular"
        icon={TrendingUp}
        vns={popular}
        loading={loading}
        sortParam="votecount"
      />
      <VNRow
        title="Top Rated"
        icon={Star}
        vns={topRated}
        loading={loading}
        sortParam="rating"
      />
    </motion.div>
  );
};
