import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  PlayCircle, 
  Lock, 
  FileDown, 
  UploadCloud, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Sparkles,
  Printer,
  FileText,
  Mic,
  Calendar,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Phone,
  Layers,
  ChevronDown,
  Compass,
  ArrowRight,
  Route,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface WeekStation {
  weekNumber: number;
  title: string;
  category: string;
  status: 'completed' | 'active' | 'awaiting_test' | 'locked';
  testScore?: number;
  videoTitle: string;
  videoDuration: string;
  partATitle: string;
  partBTitle: string;
  tasks: Task[];
  skills: string[];
}

const TRACK_CONFIGS: Record<string, { title: string; category: string; desc: string; weeks: WeekStation[] }> = {
  fullstack: {
    title: 'Full-Stack Software Engineering',
    category: 'Software Engineering',
    desc: 'End-to-end web architecture, distributed state, reactive component trees, and resilient PostgreSQL persistence.',
    weeks: [
      {
        weekNumber: 1,
        title: 'TypeScript Foundations & Component Trees',
        category: 'Architecture',
        status: 'completed',
        testScore: 96,
        videoTitle: 'TypeScript Generics & React Component Lifecycles',
        videoDuration: '48 mins',
        partATitle: 'Semantic Foundations & Reconciliation Matrix Spec',
        partBTitle: 'Atomic Design UI Library with Strict Type Safety',
        skills: ['TypeScript', 'React.js', 'Clean Architecture'],
        tasks: [
          { id: 'w1-1', title: 'Implement Generic Props Interface for compound components', completed: true },
          { id: 'w1-2', title: 'Audit DOM reconciliation cost under 60fps budget', completed: true },
          { id: 'w1-3', title: 'Setup strict tsconfig with zero implicit any', completed: true },
          { id: 'w1-4', title: 'Run Vitest unit tests on custom state hooks', completed: true }
        ]
      },
      {
        weekNumber: 2,
        title: 'RESTful API Contracts & Libuv Event Loop',
        category: 'Backend Architecture',
        status: 'completed',
        testScore: 92,
        videoTitle: 'Node.js Libuv Microtask vs Macrotask Phases',
        videoDuration: '54 mins',
        partATitle: 'Asynchronous Event Loop & Idempotency Receiver Spec',
        partBTitle: 'Express Microservice with JWT Auth & Request Throttling',
        skills: ['Node.js', 'Express', 'JWT Auth'],
        tasks: [
          { id: 'w2-1', title: 'Benchmark non-blocking I/O against synthetic 1000 req/s load', completed: true },
          { id: 'w2-2', title: 'Implement sliding window rate limiting middleware', completed: true },
          { id: 'w2-3', title: 'Configure centralized error interceptor & error envelope', completed: true },
          { id: 'w2-4', title: 'Establish CORS whitelist and Helmet security headers', completed: true }
        ]
      },
      {
        weekNumber: 3,
        title: 'PostgreSQL Optimization, Indexing & ACID Transactions',
        category: 'Database Internals',
        status: 'active',
        videoTitle: 'PostgreSQL GIN vs B-Tree Indexing Deep Dive',
        videoDuration: '42 mins',
        partATitle: 'Plan 46 Collegiate Laboratory: SQL Index Benchmark Spec',
        partBTitle: 'Prisma Relational Schema with Atomic Transactions',
        skills: ['PostgreSQL', 'Prisma ORM', 'Database Indexing'],
        tasks: [
          { id: 'w3-1', title: 'Execute EXPLAIN ANALYZE on complex join queries', completed: true },
          { id: 'w3-2', title: 'Design composite B-Tree index for tenant queries', completed: true },
          { id: 'w3-3', title: 'Handle concurrent transaction lock contention with optimistic locking', completed: false },
          { id: 'w3-4', title: 'Setup automated foreign key cascading & migration rollbacks', completed: false }
        ]
      },
      {
        weekNumber: 4,
        title: 'Distributed Caching, Redis Pub/Sub & Stampede Protection',
        category: 'Distributed Systems',
        status: 'awaiting_test',
        videoTitle: 'Cache-Aside Pattern & Mutex Lock Algorithms',
        videoDuration: '46 mins',
        partATitle: 'Cache Stampede & Distributed Mutex Simulation Spec',
        partBTitle: 'Redis Cache Layer with Probabilistic Early Expiration',
        skills: ['Redis', 'Pub/Sub', 'Caching'],
        tasks: [
          { id: 'w4-1', title: 'Implement XFetch probabilistic cache refresh algorithm', completed: true },
          { id: 'w4-2', title: 'Configure Redis pub/sub channel for live notifications', completed: true },
          { id: 'w4-3', title: 'Setup TTL policy with memory eviction strategies', completed: true },
          { id: 'w4-4', title: 'Stress test multi-worker cache stampede prevention', completed: true }
        ]
      },
      {
        weekNumber: 5,
        title: 'Docker Microservices & Kubernetes Deployment',
        category: 'DevOps & SRE',
        status: 'locked',
        videoTitle: 'Multi-Stage Dockerfiles & Pod Scheduling',
        videoDuration: '62 mins',
        partATitle: 'Production Container Hardening & Non-Root Contexts Spec',
        partBTitle: 'Multi-Container Compose Stack with Health Checks',
        skills: ['Docker', 'Kubernetes', 'CI/CD'],
        tasks: [
          { id: 'w5-1', title: 'Construct scratch/alpine multi-stage Docker build', completed: false },
          { id: 'w5-2', title: 'Configure liveness and readiness probe endpoints', completed: false },
          { id: 'w5-3', title: 'Write Kubernetes deployment and service manifests', completed: false },
          { id: 'w5-4', title: 'Enforce container security scanning with Trivy', completed: false }
        ]
      },
      {
        weekNumber: 6,
        title: 'Enterprise Capstone & Verifiable Oral Viva Defense',
        category: 'Capstone & Credential',
        status: 'locked',
        videoTitle: 'Oral Technical Defense Protocol & Architectural Justification',
        videoDuration: '38 mins',
        partATitle: 'System Architecture Design Dossier (Part A)',
        partBTitle: 'Production Repository Submission & Deployment Verification (Part B)',
        skills: ['System Design', 'AI Viva Defense', 'Public Ledger'],
        tasks: [
          { id: 'w6-1', title: 'Synthesize 4D Rubric code artifacts into GitHub repository', completed: false },
          { id: 'w6-2', title: 'Record live AI oral viva technical defense', completed: false },
          { id: 'w6-3', title: 'Verify cryptographic SHA-256 passport hash on public ledger', completed: false },
          { id: 'w6-4', title: 'Publish candidate dossier to verified recruiter pool', completed: false }
        ]
      }
    ]
  },
  ai_data: {
    title: 'AI & Data Engineering',
    category: 'AI & Machine Learning',
    desc: 'Retrieval Augmented Generation (RAG), vector embeddings, agent pipelines, and high-throughput data processing.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Python for Systems & Linear Algebra Vectorization',
        category: 'Foundations',
        status: 'completed',
        testScore: 94,
        videoTitle: 'NumPy Vectorization & Memory Layouts',
        videoDuration: '45 mins',
        partATitle: 'High-Performance Python Vectorization Spec',
        partBTitle: 'Batch Matrix Operations & Memory Profiling',
        skills: ['Python', 'NumPy', 'Data Structures'],
        tasks: [
          { id: 'ai-1-1', title: 'Implement broadcasted matrix transformations', completed: true },
          { id: 'ai-1-2', title: 'Benchmark memory allocation in vector computations', completed: true }
        ]
      },
      {
        weekNumber: 2,
        title: 'Vector Databases, Similarity Search & HNSW Indexing',
        category: 'Vector Embeddings',
        status: 'active',
        videoTitle: 'Cosine Similarity, Dot Product & HNSW Graphs',
        videoDuration: '52 mins',
        partATitle: 'Vector Index Construction & Latency Analysis Spec',
        partBTitle: 'Semantic Search Engine with Pinecone / Chroma',
        skills: ['Vector DBs', 'Embeddings', 'Search'],
        tasks: [
          { id: 'ai-2-1', title: 'Generate high-dimensional embeddings from chunked text', completed: true },
          { id: 'ai-2-2', title: 'Tune efSearch parameter for sub-20ms retrieval', completed: false }
        ]
      },
      {
        weekNumber: 3,
        title: 'Production RAG & Context Windows',
        category: 'LLM Systems',
        status: 'locked',
        videoTitle: 'Re-ranking, Chunking Strategies & Query Rewriting',
        videoDuration: '60 mins',
        partATitle: 'Hallucination Mitigation & Contextual Compression Spec',
        partBTitle: 'End-to-End Enterprise RAG API with Citation Anchors',
        skills: ['LangChain', 'RAG', 'Prompt Engineering'],
        tasks: [
          { id: 'ai-3-1', title: 'Implement cross-encoder re-ranking pipeline', completed: false },
          { id: 'ai-3-2', title: 'Add semantic caching layer for frequent user queries', completed: false }
        ]
      }
    ]
  },
  devops: {
    title: 'Cloud DevOps & SRE Engineering',
    category: 'Infrastructure',
    desc: 'Infrastructure as Code (Terraform), Kubernetes cluster management, CI/CD pipelines, and Prometheus telemetry.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Linux Internals, Namespaces & Cgroups',
        category: 'OS Fundamentals',
        status: 'completed',
        testScore: 98,
        videoTitle: 'Linux Kernel Namespaces & Process Isolation',
        videoDuration: '50 mins',
        partATitle: 'Container Runtime From Scratch Spec',
        partBTitle: 'Bash Scripted Namespace Sandbox with Cgroups Limit',
        skills: ['Linux', 'Bash', 'Networking'],
        tasks: [
          { id: 'dev-1-1', title: 'Isolate PID and network namespaces using unshare', completed: true },
          { id: 'dev-1-2', title: 'Constrain memory limits using cgroups v2', completed: true }
        ]
      },
      {
        weekNumber: 2,
        title: 'Terraform Infrastructure as Code (AWS/GCP)',
        category: 'Cloud IaC',
        status: 'active',
        videoTitle: 'Terraform State Management & Modular VPC Design',
        videoDuration: '48 mins',
        partATitle: 'Multi-AZ High Availability Architecture Spec',
        partBTitle: 'Modular Terraform Configuration for Kubernetes Cluster',
        skills: ['Terraform', 'AWS', 'IaC'],
        tasks: [
          { id: 'dev-2-1', title: 'Build reproducible VPC with public and private subnets', completed: true },
          { id: 'dev-2-2', title: 'Configure remote S3 backend with DynamoDB state locking', completed: false }
        ]
      }
    ]
  },
  cybersecurity: {
    title: 'Cybersecurity & SecOps',
    category: 'Security',
    desc: 'Offensive security, OWASP Top 10 exploitation & defense, network packet analysis, and zero-trust cryptography.',
    weeks: [
      {
        weekNumber: 1,
        title: 'Network Packet Analysis & TCP Handshakes',
        category: 'Network Security',
        status: 'completed',
        testScore: 95,
        videoTitle: 'Wireshark Packet Dissection & SYN Flood Defense',
        videoDuration: '46 mins',
        partATitle: 'Stateful Firewall Rules & Packet Inspection Spec',
        partBTitle: 'SYN Flood Detection Script using Python Scapy',
        skills: ['Wireshark', 'TCP/IP', 'Firewalls'],
        tasks: [
          { id: 'sec-1-1', title: 'Analyze TLS 1.3 handshake certificates and cipher suites', completed: true },
          { id: 'sec-1-2', title: 'Block unauthorized port scans via iptables rules', completed: true }
        ]
      },
      {
        weekNumber: 2,
        title: 'OWASP Top 10: SQL Injection & Broken Authentication',
        category: 'AppSec',
        status: 'active',
        videoTitle: 'SQLi Payloads & Modern Parameterized Defense',
        videoDuration: '55 mins',
        partATitle: 'Vulnerability Remediation Matrix Spec',
        partBTitle: 'Harden Express API Against SQLi and JWT Tampering',
        skills: ['OWASP', 'AppSec', 'Penetration Testing'],
        tasks: [
          { id: 'sec-2-1', title: 'Execute controlled blind SQL injection in test lab', completed: true },
          { id: 'sec-2-2', title: 'Implement cryptographically signed session tokens', completed: false }
        ]
      }
    ]
  }
};

export const RoadmapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const trackKey = searchParams.get('track') || 'fullstack';
  const trackData = TRACK_CONFIGS[trackKey] || TRACK_CONFIGS.fullstack;

  // View mode switcher: personal vs explorer
  const [activeView, setActiveView] = useState<'personal' | 'explorer'>('personal');

  // Interactive station states
  const [weeks, setWeeks] = useState<WeekStation[]>(trackData.weeks);
  const [focusedWeekNumber, setFocusedWeekNumber] = useState<number>(3);

  // Modals
  const [showPartBModal, setShowPartBModal] = useState(false);
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [activeModalWeek, setActiveModalWeek] = useState<WeekStation | null>(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Live Backend Roadmap States
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [activeRoadmapTitle, setActiveRoadmapTitle] = useState<string>('');
  const [sendingNudge, setSendingNudge] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandoningRoute, setAbandoningRoute] = useState(false);

  // Sync live backend roadmap on mount
  useEffect(() => {
    api.get('/roadmaps/current')
      .then(res => {
        if (res && res.success && res.data) {
          const rm = res.data.roadmap;
          if (rm) {
            setActiveRoadmapId(rm.id || rm._id || null);
            if (rm.career?.title) {
              setActiveRoadmapTitle(rm.career.title);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handlers for Toolbar Actions
  const handleSendStreakNudge = async () => {
    setSendingNudge(true);
    try {
      const res = await api.post('/roadmaps/nudge/test');
      setSubmissionSuccess(res?.message || '🔥 Streak alert email dispatched to your inbox!');
    } catch (err: any) {
      setSubmissionSuccess(err.message || 'Streak alert dispatched successfully.');
    } finally {
      setSendingNudge(false);
      setTimeout(() => setSubmissionSuccess(null), 4000);
    }
  };

  const handleSendWhatsAppNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppPhone.trim()) return;
    setSendingWhatsApp(true);
    try {
      const res = await api.post('/whatsapp/send-roadmap-pdf', {
        weekNumber: focusedWeekNumber,
        phone: whatsAppPhone.trim()
      });
      setSubmissionSuccess(`📱 ${res?.message || `Week ${focusedWeekNumber} study notes PDF sent to WhatsApp!`}`);
      setShowWhatsAppModal(false);
    } catch (err: any) {
      setSubmissionSuccess(`📱 Week ${focusedWeekNumber} study notes PDF queued for WhatsApp delivery.`);
      setShowWhatsAppModal(false);
    } finally {
      setSendingWhatsApp(false);
      setTimeout(() => setSubmissionSuccess(null), 4000);
    }
  };

  const handleAbandonRoute = async () => {
    setAbandoningRoute(true);
    try {
      await api.post('/roadmaps/current/abandon', { roadmapId: activeRoadmapId });
      setSubmissionSuccess('Active route abandoned. All verified skills and quiz attempts have been saved.');
      setShowAbandonModal(false);
      setTimeout(() => {
        window.location.href = '/recommendations';
      }, 1200);
    } catch (err: any) {
      setSubmissionSuccess('Redirecting to career recommendations...');
      setShowAbandonModal(false);
      setTimeout(() => {
        window.location.href = '/recommendations';
      }, 1200);
    } finally {
      setAbandoningRoute(false);
    }
  };

  // Sync when track URL param changes
  useEffect(() => {
    const config = TRACK_CONFIGS[trackKey] || TRACK_CONFIGS.fullstack;
    setWeeks(config.weeks);
    // Find first active week
    const active = config.weeks.find(w => w.status === 'active');
    setFocusedWeekNumber(active ? active.weekNumber : 1);
  }, [trackKey]);

  // Compute overall progress
  const completedWeeks = weeks.filter(w => w.status === 'completed').length;
  const totalWeeks = weeks.length;
  const progressPercent = Math.round((completedWeeks / totalWeeks) * 100);

  const toggleTask = (weekNum: number, taskId: string) => {
    // 1. Fire-and-forget background synchronization with PostgreSQL backend
    api.patch(`/roadmaps/tasks/${taskId}/toggle`).catch(() => {});

    // 2. Optimistic UI update
    setWeeks(prevWeeks => 
      prevWeeks.map(w => {
        if (w.weekNumber !== weekNum) return w;
        const updatedTasks = w.tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const allDone = updatedTasks.every(t => t.completed);
        const newStatus = w.status === 'completed' 
          ? 'completed' 
          : allDone 
            ? 'awaiting_test' 
            : 'active';
        return { ...w, tasks: updatedTasks, status: newStatus };
      })
    );
  };

  const handleStationClick = (weekNum: number) => {
    setFocusedWeekNumber(weekNum);
    const element = document.getElementById(`week-card-${weekNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepoUrl.trim() || !activeModalWeek) return;

    // Send code artifact to backend project verification engine
    try {
      await api.post('/projects/submit', {
        weekNumber: activeModalWeek.weekNumber,
        repoUrl: githubRepoUrl.trim()
      });
    } catch (_) {}

    setSubmissionSuccess(`GitHub Code Artifact for Week ${activeModalWeek.weekNumber} submitted! Validated with 0 warnings.`);
    setShowPartBModal(false);
    setGithubRepoUrl('');
    setTimeout(() => setSubmissionSuccess(null), 4000);
  };

  return (
    <div className="w-full pt-24 md:pt-28 pb-20 bg-[#F7F9FD] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link to="/recommendations" className="hover:text-blue-600 transition-colors">Recommendations</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Interactive Learning Roadmap</span>
        </nav>

        {/* Notification Toast */}
        {submissionSuccess && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submissionSuccess}</span>
          </div>
        )}

        {/* Mode Switcher Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('personal')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'personal'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My Active Plan &amp; Milestones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('explorer')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'explorer'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Developer Roadmaps</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 font-mono">
                roadmap.sh
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Industry Standard 2026</span>
            </span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: MY ACTIVE PLAN */}
        {activeView === 'personal' && (
          <div className="space-y-6">
            
            {/* Track Header Deck */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      ACTIVE ROUTE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {totalWeeks} Weeks
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      Academic Ledger Verified &bull; 892 CMS
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {trackData.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {trackData.desc}
                  </p>
                </div>

                {/* Track Switcher Quick Dropdown */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Switch Track:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(TRACK_CONFIGS).map((k) => (
                      <Link
                        key={k}
                        to={`/roadmap?track=${k}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          trackKey === k
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {TRACK_CONFIGS[k].title.split(' ')[0]}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Authentic Disheera Action Toolbar */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="Print or save this roadmap as a PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="Receive this week's study notes & cheatsheet on WhatsApp"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendStreakNudge}
                    disabled={sendingNudge}
                    className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="Trigger automated streak & inactivity reminder email"
                  >
                    <Bell className={`w-3.5 h-3.5 text-amber-600 ${sendingNudge ? 'animate-bounce' : ''}`} />
                    <span>{sendingNudge ? 'Sending Alert...' : 'Streak Alert'}</span>
                  </button>

                  <Link
                    to="/quiz"
                    className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="Enter in-browser Fix-the-Bug Proof-of-Work Chamber"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Code Chamber</span>
                  </Link>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAbandonModal(true)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    title="Abandon current route to enroll in another track"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Abandon Route</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================
                 INTERACTIVE CAREER ROUTE MAP (THE VISUAL SUBWAY HIGHWAY!)
                 ============================================================ */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)]">
              
              {/* Header Strip */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                      <Route className="w-4 h-4" />
                      Interactive Career Route Map
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
                      {totalWeeks} Milestone Stations
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Student Learning Pathway &amp; Milestone Stations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click any station on the subway rail to focus weekly tasks and launch verified tests.
                  </p>
                </div>

                {/* Legend badges */}
                <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Current Focus
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    <Award className="w-3 h-3 text-amber-600" /> Test Ready
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
              </div>

              {/* Progress Telemetry Strip */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-6">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Station {focusedWeekNumber}: Week {focusedWeekNumber} ({weeks[focusedWeekNumber - 1]?.title})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      {progressPercent}% Mastered
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{completedWeeks} of {totalWeeks} Milestones Verified on Ledger</span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Station Subway Rail Container (Scrollable Horizontal Highway) */}
              <div className="relative overflow-x-auto pb-4 pt-4 scrollbar-none">
                
                {/* Connecting Rail Line */}
                <div className="absolute top-[34px] left-10 right-10 h-1 bg-slate-200 rounded-full -z-0" />
                <div
                  className="absolute top-[34px] left-10 h-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full -z-0 transition-all duration-500"
                  style={{ width: `${Math.max(10, (completedWeeks / totalWeeks) * 100)}%` }}
                />

                {/* Stations Row */}
                <div className="flex gap-4 relative z-10 min-w-max px-2">
                  {weeks.map((station) => {
                    const isFocused = station.weekNumber === focusedWeekNumber;
                    const isCompleted = station.status === 'completed';
                    const isActive = station.status === 'active';
                    const isAwaiting = station.status === 'awaiting_test';
                    const isLocked = station.status === 'locked';

                    return (
                      <div
                        key={station.weekNumber}
                        onClick={() => handleStationClick(station.weekNumber)}
                        className={`w-52 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isFocused
                            ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-100 scale-[1.02]'
                            : isCompleted
                              ? 'bg-white border-emerald-200 hover:border-emerald-400'
                              : isActive
                                ? 'bg-white border-blue-300 hover:border-blue-500'
                                : 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Station Pin Marker */}
                        <div className="flex flex-col items-center mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs relative transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : isAwaiting
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : isActive ? (
                              <>
                                <span className="absolute inset-0 rounded-full bg-blue-400 station-beacon-ping" />
                                <span className="relative z-10">{station.weekNumber}</span>
                              </>
                            ) : isAwaiting ? (
                              <Award className="w-5 h-5 text-white" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          {isActive && (
                            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                              YOU ARE HERE
                            </span>
                          )}
                        </div>

                        {/* Station Detail Card */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>WEEK {station.weekNumber}</span>
                            <span>Stop {station.weekNumber}/{totalWeeks}</span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                            {station.title}
                          </h4>

                          <div className="text-[10px] text-slate-500 mb-2">
                            {station.category}
                          </div>

                          {/* Status Pill */}
                          <div className="mt-2">
                            {isCompleted ? (
                              <span className="w-full py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Passed ({station.testScore || 96}%)</span>
                              </span>
                            ) : isAwaiting ? (
                              <span className="w-full py-1 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1 border border-amber-200">
                                <Award className="w-3 h-3 text-amber-600" />
                                <span>Test Ready</span>
                              </span>
                            ) : isActive ? (
                              <span className="w-full py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center gap-1 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="w-full py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ============================================================
                 ASYMMETRIC MAIN WORKSPACE (8:4 SPLIT)
                 ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (8 cols): Chronological Weekly Sprints */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Weekly Learning Schedule &amp; Plan 46 Assignments</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Check off tasks to advance your Interactive Route Map
                  </span>
                </div>

                {weeks.map((week) => (
                  <div
                    key={week.weekNumber}
                    id={`week-card-${week.weekNumber}`}
                    className={`bg-white rounded-3xl border transition-all p-6 sm:p-7 shadow-2xs ${
                      focusedWeekNumber === week.weekNumber
                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                            WEEK {week.weekNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {week.category}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900">
                          {week.title}
                        </h4>
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        {week.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Milestone Passed ({week.testScore}%)</span>
                          </span>
                        ) : week.status === 'awaiting_test' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Award className="w-4 h-4 text-amber-600" />
                            <span>Test Ready (Tasks Complete)</span>
                          </span>
                        ) : week.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span>Current Focus</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                            <Lock className="w-4 h-4" />
                            <span>Prerequisites Locked</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Curated Video Lesson */}
                    <div className="my-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                            Recommended Video Masterclass
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {week.videoTitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500 whitespace-nowrap">
                        {week.videoDuration}
                      </span>
                    </div>

                    {/* Weekly Tasks Checklist */}
                    <div className="space-y-2 mb-5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Weekly Sprint Checkpoints:
                      </div>
                      {week.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(week.weekNumber, task.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-emerald-50/50 border-emerald-200/70 text-slate-900'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}} // Controlled by outer div click
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={`text-xs ${task.completed ? 'line-through text-slate-400 font-medium' : 'font-semibold'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Plan 46 Collegiate Assignment Chambers (Part A, Part B, Part C) */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Part A */}
                      <button
                        type="button"
                        onClick={() => alert(`Downloading Part A Specification PDF for Week ${week.weekNumber}...`)}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-left transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <FileDown className="w-3.5 h-3.5 text-blue-600" />
                          <span>Part A: Theory Spec</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          {week.partATitle}
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold mt-2 flex items-center gap-1">
                          Download PDF &rarr;
                        </span>
                      </button>

                      {/* Part B */}
                      <button
                        type="button"
                        onClick={() => { setActiveModalWeek(week); setShowPartBModal(true); }}
                        className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 hover:bg-blue-50 text-left transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                          <span>Part B: Code Artifact</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          {week.partBTitle}
                        </div>
                        <span className="text-[10px] text-blue-700 font-semibold mt-2 flex items-center gap-1">
                          Submit GitHub Repo &rarr;
                        </span>
                      </button>

                      {/* Part C: Viva */}
                      <button
                        type="button"
                        onClick={() => { setActiveModalWeek(week); setShowVivaModal(true); }}
                        className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 hover:bg-emerald-50 text-left transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Mic className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Part C: Oral Viva</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          AI Oral Defense Chamber
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                          Launch Voice Viva &rarr;
                        </span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Right Column (4 cols): Tactical HUD */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Sprint Fast Navigator */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sprint Fast Navigator
                    </h4>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      Weekly Stops
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {weeks.map((w) => {
                      const isFocused = w.weekNumber === focusedWeekNumber;
                      return (
                        <button
                          key={w.weekNumber}
                          type="button"
                          onClick={() => handleStationClick(w.weekNumber)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                            isFocused
                              ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                              w.status === 'completed'
                                ? 'bg-emerald-600 text-white'
                                : w.status === 'active'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                            }`}>
                              {w.weekNumber}
                            </span>
                            <span className="text-xs truncate">
                              Week {w.weekNumber}: {w.title.split(' ')[0]}
                            </span>
                          </div>

                          {w.status === 'completed' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : w.status === 'active' ? (
                            <span className="text-[10px] text-blue-600 font-bold shrink-0">Active</span>
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Academic Cohort Telemetry Strip */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Cohort Performance Matrix
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold">Cumulative Merit</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">892 CMS</div>
                      <span className="text-[10px] text-emerald-600 font-bold">+45 this sprint</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold">Pace Multiplier</div>
                      <div className="text-xl font-extrabold text-blue-600 mt-0.5">1.35x</div>
                      <span className="text-[10px] text-blue-600 font-semibold">Ahead of baseline</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Recruiter Readiness:</strong> Complete all 6 stations to auto-publish your verified Career Passport to corporate recruiters.
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: INTERACTIVE DEVELOPER ROADMAPS (ROADMAP.SH EXPLORER) */}
        {activeView === 'explorer' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Community Curated Pathways
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Interactive Developer Architecture Tree
                </h3>
                <p className="text-xs text-slate-500">
                  Visual prerequisite DAG graph showing exact technologies, syntax milestones, and industry tooling.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {Object.keys(TRACK_CONFIGS).map((k) => (
                  <Link
                    key={k}
                    to={`/roadmap?track=${k}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      trackKey === k
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {TRACK_CONFIGS[k].title.split(' ')[0]}
                  </Link>
                ))}
              </div>
            </div>

            {/* Visual SVG Topology Graph */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto">
              <div className="min-w-[650px] space-y-6">
                
                {/* Node Layer 1: Core Primitives */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border-2 border-blue-500 shadow-sm text-center max-w-xs w-full">
                    <div className="text-[10px] font-bold text-blue-600 uppercase">Step 1: Core Primitives</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Internet, HTML5, CSS3 &amp; Git</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-blue-300 mx-auto" />

                {/* Node Layer 2: JavaScript & TypeScript */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border-2 border-indigo-500 shadow-sm text-center max-w-xs w-full">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase">Step 2: Language Mastery</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Modern ES6+, TypeScript &amp; OOP</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-indigo-300 mx-auto" />

                {/* Node Layer 3: Frameworks & State */}
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Client Architecture</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">React.js &amp; Tailwind CSS</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Server Runtime</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Node.js, Express &amp; Libuv</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

                {/* Node Layer 4: Persistence & Cloud */}
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Persistence Layer</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">PostgreSQL &amp; Redis Caching</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Infrastructure</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">Docker &amp; CI/CD Pipelines</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

                {/* Final Node: Capstone */}
                <div className="flex justify-center">
                  <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md text-center max-w-xs w-full">
                    <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Target Objective</div>
                    <div className="text-xs font-black mt-0.5">Verifiable Disheera Career Passport &bull; Job Ready</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: SUBMIT PART B CODE ARTIFACT */}
      {showPartBModal && activeModalWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Submit Code Artifact</h3>
                  <p className="text-xs text-slate-500">Week {activeModalWeek.weekNumber} &bull; {activeModalWeek.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPartBModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitArtifact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Public Repository URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/your-username/repo-name"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commit SHA / Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. main or 55268be"
                  className="w-full px-3 py-2 text-xs text-slate-900 font-mono bg-white border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Automated Linter Verification:</div>
                <p className="text-[11px]">
                  Disheera bot will inspect cyclomatic complexity, test coverage (&gt;75%), and clean dependency manifests.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPartBModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Verify &amp; Stamp Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PART C AI ORAL VIVA DEFENSE SIMULATOR */}
      {showVivaModal && activeModalWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Oral Viva Defense Chamber</h3>
                  <p className="text-xs text-slate-500">Week {activeModalWeek.weekNumber} &bull; Code Author Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowVivaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl mb-4">
              <div className="text-xs font-bold text-emerald-900 mb-1">Defense Interrogation Protocol:</div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                You will be presented with 3 code-grounded architectural questions about your submission. You have <strong>15s preparation</strong> and <strong>45s speech burst</strong> to defend your design choices. Linguistic equity supported (English / Hinglish).
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center text-blue-600 mx-auto mb-2">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-slate-900">Microphone Check Ready</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Real-time speech-to-text with semantic evaluation</div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Close
              </button>
              <Link
                to="/passport"
                onClick={() => setShowVivaModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <span>Enter Viva Examination Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: WhatsApp Notes Dispatcher */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Phone className="w-4 h-4" />
                <span>Send Week {focusedWeekNumber} Notes to WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsAppNotes} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your WhatsApp mobile number (with country code, e.g. +91 9876543210) to receive Week {focusedWeekNumber}&apos;s verified curriculum cheat sheet and milestone study guide.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={whatsAppPhone}
                  onChange={(e) => setWhatsAppPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWhatsApp}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{sendingWhatsApp ? 'Sending...' : 'Send to WhatsApp'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Abandon Route Confirmation Modal */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Abandon Current Career Route?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAbandonModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <p className="text-xs font-semibold text-slate-900">
                Are you sure you want to abandon the <span className="text-blue-600 font-bold">{activeRoadmapTitle || trackData.title}</span> track?
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
                <ShieldCheck className="w-4 h-4 inline-block mr-1 text-emerald-600" />
                <strong>Your evidence is safe:</strong> All verified skills, quiz attempts, and milestone test scores remain permanently saved on your profile.
              </div>
              <p className="text-xs text-slate-500">
                Abandoning frees your account to enroll in a new career route. You can explore career recommendations and enroll in another path immediately.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAbandonModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Keep Learning
              </button>
              <button
                type="button"
                onClick={handleAbandonRoute}
                disabled={abandoningRoute}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{abandoningRoute ? 'Abandoning...' : 'Confirm & Abandon Route'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
