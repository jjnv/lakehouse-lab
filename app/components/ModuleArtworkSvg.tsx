import type { ModuleArtwork, ModuleArtworkMotif } from "../enterprise/contracts";
import type { ReactNode } from "react";

type ModuleArtworkSvgProps = {
  artwork: ModuleArtwork;
  decorative?: boolean;
};

export default function ModuleArtworkSvg({ artwork, decorative = false }: ModuleArtworkSvgProps) {
  return (
    <svg
      className="module-artwork-svg"
      viewBox="0 0 1200 675"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : artwork.alt}
      focusable="false"
    >
      <defs>
        <linearGradient id={`art-bg-${artwork.motif}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--module-artwork-soft, #f5f6f8)" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" rx="42" fill={`url(#art-bg-${artwork.motif})`} />
      <path d="M132 528h936" stroke="#ded9d2" strokeWidth="7" strokeLinecap="round" />
      <path d="M190 454h820" stroke="#e8e3dc" strokeWidth="5" strokeLinecap="round" />
      <path
        d={backbonePath(artwork.motif)}
        fill="none"
        stroke="var(--module-artwork-accent, #385d7a)"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".78"
      />
      <MotifSymbol motif={artwork.motif} />
    </svg>
  );
}

function backbonePath(motif: ModuleArtworkMotif) {
  const paths: Record<ModuleArtworkMotif, string> = {
    platform: "M224 185c118-82 238-70 357-6 130 70 244 68 396-24",
    compute: "M214 438h172V228h188v210h188V186h224",
    notebooks: "M238 190h250c68 0 100 44 112 94 12-50 44-94 112-94h250",
    dataframes: "M240 235h720M240 335h720M240 435h720",
    spark: "M266 430l132-132 118 70 126-174 116 142 164-110",
    delta: "M600 146l320 390H280z",
    medallion: "M254 472c132-112 218-154 346-154s214 42 346 154",
    "batch-ingest": "M220 242h238l92 84h430",
    "auto-loader": "M226 418c92-142 230-90 280-190 72-142 254-94 286 26 100-18 164 32 184 100",
    jobs: "M250 202h220v126h220v126h260",
    "unity-cicd": "M268 452h196V254h272v198h196",
    "associate-project": "M600 138l88 178 196 28-142 138 34 196-176-92-176 92 34-196-142-138 196-28z",
    streaming: "M170 242c156-98 258-76 420 4 178 88 298 88 440-8",
    stateful: "M198 372c112-126 238-132 356-28 118 104 242 98 448-90",
    kafka: "M226 236h196l88 84h164l88-84h196",
    cdc: "M228 238h260l92 84h392M972 438H712l-92-84H228",
    "streaming-project": "M206 464c116-184 294-116 392-212 112-110 250-76 396 80",
    "declarative-pipelines": "M230 474h176V254h190v220h190V180h184",
    expectations: "M238 230h724M238 332h724M238 434h724",
    repairs: "M242 438c126-148 250-124 360 0s238 148 360 0",
    alerts: "M600 142c154 0 248 118 248 286H352c0-168 94-286 248-286z",
    "pipeline-project": "M216 506c158-238 328-104 384-286 56 182 226 48 384 286",
    "spark-tuning": "M218 472c110-222 250-270 420-162 104 66 210 54 344-82",
    "delta-tuning": "M284 520l160-276 156 276 156-276 160 276",
    finops: "M246 510h118V382h118V300h118V214h118V332h118V252h118v258",
    observability: "M210 420c126-86 224-84 318 0 94 84 190 86 318 0 46-30 90-48 134-52",
    reliability: "M600 140l286 88v188c0 120-118 198-286 246-168-48-286-126-286-246V228z",
    "python-tests": "M258 210h310v252H258zM632 210h310v252H632z",
    bundles: "M600 128l292 168v232L600 664 308 528V296z",
    privacy: "M600 142c126 0 218 90 218 206v44H382v-44c0-116 92-206 218-206z",
    sharing: "M232 338c134-170 268-170 402 0s268 170 402 0",
    "professional-capstone": "M600 126l312 438H288z",
  };
  return paths[motif];
}

function MotifSymbol({ motif }: { motif: ModuleArtworkMotif }) {
  switch (motif) {
    case "platform":
      return <LayeredPanels labels={[344, 294, 364]} />;
    case "compute":
      return <ComputeSymbol />;
    case "notebooks":
      return <NotebookSymbol />;
    case "dataframes":
      return <GridSymbol columns={5} rows={4} />;
    case "spark":
      return <SparkSymbol />;
    case "delta":
      return <DeltaSymbol />;
    case "medallion":
      return <MedallionSymbol />;
    case "batch-ingest":
      return <BatchSymbol />;
    case "auto-loader":
      return <CloudLoaderSymbol />;
    case "jobs":
      return <DagSymbol />;
    case "unity-cicd":
      return <GovernanceSymbol />;
    case "associate-project":
      return <MilestoneSymbol small />;
    case "streaming":
      return <StreamingSymbol />;
    case "stateful":
      return <StatefulSymbol />;
    case "kafka":
      return <QueueSymbol />;
    case "cdc":
      return <CdcSymbol />;
    case "streaming-project":
      return <SlaSymbol />;
    case "declarative-pipelines":
      return <PipelineSymbol />;
    case "expectations":
      return <ExpectationSymbol />;
    case "repairs":
      return <RepairSymbol />;
    case "alerts":
      return <AlertSymbol />;
    case "pipeline-project":
      return <ProjectGraphSymbol />;
    case "spark-tuning":
      return <TuningSymbol />;
    case "delta-tuning":
      return <ClusterSymbol />;
    case "finops":
      return <FinopsSymbol />;
    case "observability":
      return <ObservabilitySymbol />;
    case "reliability":
      return <ReliabilitySymbol />;
    case "python-tests":
      return <PythonTestSymbol />;
    case "bundles":
      return <BundleSymbol />;
    case "privacy":
      return <PrivacySymbol />;
    case "sharing":
      return <SharingSymbol />;
    case "professional-capstone":
      return <MilestoneSymbol />;
  }
}

function Card({ x, y, w = 190, h = 140, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  return <g><rect x={x} y={y} width={w} height={h} rx="18" fill="#fff" stroke="#2a2431" strokeWidth="6" />{children}</g>;
}

function Line({ x1, y1, x2, y2, muted = false }: { x1: number; y1: number; x2: number; y2: number; muted?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={muted ? "#9a949f" : "var(--module-artwork-accent, #385d7a)"} strokeWidth="11" strokeLinecap="round" />;
}

function LayeredPanels({ labels }: { labels: [number, number, number] }) {
  return <g><Card x={254} y={286}><Line x1={294} y1={labels[0]} x2={402} y2={labels[0]} /><Line x1={294} y1={labels[0] + 34} x2={374} y2={labels[0] + 34} muted /></Card><Card x={504} y={236}><Line x1={544} y1={labels[1]} x2={656} y2={labels[1]} /><Line x1={544} y1={labels[1] + 34} x2={690} y2={labels[1] + 34} muted /><Line x1={544} y1={labels[1] + 68} x2={626} y2={labels[1] + 68} /></Card><Card x={754} y={306}><Line x1={794} y1={labels[2]} x2={900} y2={labels[2]} /><Line x1={794} y1={labels[2] + 34} x2={874} y2={labels[2] + 34} muted /></Card></g>;
}

function ComputeSymbol() {
  return <g><Card x={220} y={226} w={190} h={220}><Line x1={260} y1={286} x2={350} y2={286} /><Line x1={260} y1={330} x2={350} y2={330} muted /><Line x1={260} y1={374} x2={350} y2={374} /></Card><Card x={505} y={164} w={190} h={282}><circle cx={600} cy={264} r={54} fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth="12" /><Line x1={552} y1={358} x2={648} y2={358} muted /></Card><Card x={790} y={250} w={190} h={196}><Line x1={830} y1={314} x2={932} y2={314} /><Line x1={830} y1={360} x2={902} y2={360} muted /></Card></g>;
}

function NotebookSymbol() {
  return <g><path d="M304 206h238c44 0 58 22 58 58v246c0-36-14-58-58-58H304z" fill="#fff" stroke="#2a2431" strokeWidth="6" /><path d="M896 206H658c-44 0-58 22-58 58v246c0-36 14-58 58-58h238z" fill="#fff" stroke="#2a2431" strokeWidth="6" /><Line x1={350} y1={280} x2={500} y2={280} /><Line x1={350} y1={330} x2={470} y2={330} muted /><Line x1={700} y1={280} x2={850} y2={280} /><Line x1={700} y1={330} x2={818} y2={330} muted /></g>;
}

function GridSymbol({ columns, rows }: { columns: number; rows: number }) {
  return <g><rect x={266} y={168} width={668} height={350} rx={20} fill="#fff" stroke="#2a2431" strokeWidth={6} />{Array.from({ length: columns + 1 }, (_, index) => <line key={`c-${index}`} x1={266 + index * (668 / columns)} y1={168} x2={266 + index * (668 / columns)} y2={518} stroke="#ded9d2" strokeWidth={5} />)}{Array.from({ length: rows + 1 }, (_, index) => <line key={`r-${index}`} x1={266} y1={168 + index * (350 / rows)} x2={934} y2={168 + index * (350 / rows)} stroke="#ded9d2" strokeWidth={5} />)}<rect x={292} y={198} width={116} height={48} rx={8} fill="var(--module-artwork-accent, #385d7a)" opacity=".82" /><rect x={558} y={286} width={116} height={48} rx={8} fill="var(--module-artwork-accent, #385d7a)" opacity=".48" /><rect x={780} y={374} width={116} height={48} rx={8} fill="var(--module-artwork-accent, #385d7a)" opacity=".68" /></g>;
}

function SparkSymbol() {
  return <g><path d="M600 132l48 150 158-76-76 158 150 48-150 48 76 158-158-76-48 150-48-150-158 76 76-158-150-48 150-48-76-158 158 76z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={600} cy={412} r={70} fill="var(--module-artwork-accent, #385d7a)" opacity=".82" /></g>;
}

function DeltaSymbol() {
  return <g><path d="M600 152l318 382H282z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M600 244l178 214H422z" fill="var(--module-artwork-accent, #385d7a)" opacity=".72" /><Line x1={500} y1={534} x2={700} y2={534} muted /></g>;
}

function MedallionSymbol() {
  return <g><ellipse cx={600} cy={250} rx={240} ry={82} fill="#fff" stroke="#2a2431" strokeWidth={6} /><ellipse cx={600} cy={346} rx={310} ry={96} fill="#fff" stroke="#2a2431" strokeWidth={6} /><ellipse cx={600} cy={462} rx={380} ry={104} fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={600} cy={250} r={34} fill="var(--module-artwork-accent, #385d7a)" /><circle cx={600} cy={346} r={34} fill="var(--module-artwork-accent, #385d7a)" opacity=".7" /><circle cx={600} cy={462} r={34} fill="var(--module-artwork-accent, #385d7a)" opacity=".45" /></g>;
}

function BatchSymbol() {
  return <g><Card x={274} y={190} w={230} h={300}><path d="M432 190v84h72" fill="none" stroke="#2a2431" strokeWidth={6} /><Line x1={318} y1={306} x2={452} y2={306} /><Line x1={318} y1={358} x2={424} y2={358} muted /></Card><path d="M570 340h236" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /><path d="M792 284l84 56-84 56" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /><Card x={840} y={250} w={150} h={180} /></g>;
}

function CloudLoaderSymbol() {
  return <g><path d="M372 426h442c78 0 130-44 130-110 0-60-46-104-112-110-32-90-128-136-222-104-62 20-104 66-122 128-72-14-138 36-138 108 0 50 34 88 22 88z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M600 214v194" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /><path d="M520 330l80 82 80-82" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /></g>;
}

function DagSymbol() {
  const nodes = [[280, 238], [500, 238], [500, 424], [720, 330], [930, 330]] as const;
  return <g>{nodes.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={58} fill="#fff" stroke="#2a2431" strokeWidth={6} />)}<path d="M338 238h104M500 296v70M556 398l110-46M558 260l108 46M778 330h94" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" /></g>;
}

function GovernanceSymbol() {
  return <g><Card x={260} y={238} w={260} h={226}><path d="M326 326h128M326 376h96" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" /></Card><path d="M700 256v-38c0-64 48-108 110-108s110 44 110 108v38" fill="none" stroke="#2a2431" strokeWidth={18} strokeLinecap="round" /><rect x={652} y={256} width={316} height={220} rx={24} fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={810} cy={354} r={36} fill="var(--module-artwork-accent, #385d7a)" /></g>;
}

function MilestoneSymbol({ small = false }: { small?: boolean }) {
  return <g><path d={small ? "M600 154l94 188 208 30-150 146 36 206-188-98-188 98 36-206-150-146 208-30z" : "M600 126l320 438H280z"} fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d={small ? "M600 274l44 88 98 14-72 70 18 98-88-46-88 46 18-98-72-70 98-14z" : "M600 238l156 214H444z"} fill="var(--module-artwork-accent, #385d7a)" opacity=".78" /></g>;
}

function StreamingSymbol() {
  return <g>{[220, 320, 420].map((y, index) => <path key={y} d={`M186 ${y}c132-${index ? 40 : 80} 260-${index ? 20 : 60} 410 0s274 ${index ? 48 : 82} 418 0`} fill="none" stroke={index === 1 ? "#2a2431" : "var(--module-artwork-accent, #385d7a)"} strokeWidth={18 - index * 3} strokeLinecap="round" opacity={index === 1 ? ".28" : ".72"} />)}<circle cx={600} cy={320} r={82} fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M560 320h80M600 280v80" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" /></g>;
}

function StatefulSymbol() {
  return <g><rect x={330} y={190} width={540} height={330} rx={24} fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={600} cy={355} r={112} fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={16} /><path d="M600 284v78l72 50" fill="none" stroke="#2a2431" strokeWidth={12} strokeLinecap="round" /><path d="M394 242h126M680 468h126" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" /></g>;
}

function QueueSymbol() {
  return <g>{[260, 430, 600, 770].map((x, index) => <Card key={x} x={x} y={250 + (index % 2) * 70} w={140} h={120}><circle cx={x + 70} cy={310 + (index % 2) * 70} r={28} fill="var(--module-artwork-accent, #385d7a)" opacity={.55 + index * .1} /></Card>)}<path d="M400 310h30M570 380h30M740 310h30" stroke="#2a2431" strokeWidth={10} strokeLinecap="round" /></g>;
}

function CdcSymbol() {
  return <g><Card x={258} y={218} w={250} h={250}><Line x1={304} y1={300} x2={448} y2={300} /><Line x1={304} y1={356} x2={410} y2={356} muted /></Card><Card x={692} y={218} w={250} h={250}><Line x1={738} y1={300} x2={882} y2={300} /><Line x1={738} y1={356} x2={844} y2={356} muted /></Card><path d="M532 286h124l-36-36M656 398H532l36 36" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" /></g>;
}

function SlaSymbol() {
  return <g><circle cx={600} cy={360} r={190} fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M470 410a140 140 0 1 1 260 0" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /><path d="M600 360l100-72" stroke="#2a2431" strokeWidth={14} strokeLinecap="round" /><rect x={510} y={454} width={180} height={28} rx={14} fill="var(--module-artwork-accent, #385d7a)" opacity=".72" /></g>;
}

function PipelineSymbol() {
  return <g><DagSymbol /><path d="M300 520h600" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" opacity=".36" /></g>;
}

function ExpectationSymbol() {
  return <g><Card x={330} y={170} w={540} h={350}>{[250, 330, 410].map((y, index) => <g key={y}><path d={`M390 ${y}l28 28 58-72`} fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /><Line x1={530} y1={y + 6} x2={782 - index * 34} y2={y + 6} muted /></g>)}</Card></g>;
}

function RepairSymbol() {
  return <g><path d="M340 450l270-270 92 92-270 270z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M706 176l76-76 90 90-76 76" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /><path d="M308 234h150l-44-44M892 438H742l44 44" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /></g>;
}

function AlertSymbol() {
  return <g><path d="M600 132c126 0 208 92 208 226v84l58 76H334l58-76v-84c0-134 82-226 208-226z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M520 548c18 46 142 46 160 0" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={16} strokeLinecap="round" /><path d="M600 242v124M600 422v8" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /></g>;
}

function ProjectGraphSymbol() {
  return <g>{[[310, 426], [450, 246], [600, 426], [750, 246], [890, 426]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={62} fill="#fff" stroke="#2a2431" strokeWidth={6} />)}<path d="M360 388l40-92 146 92 152-92 42 92" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={14} strokeLinecap="round" /></g>;
}

function TuningSymbol() {
  return <g><path d="M288 462a312 312 0 0 1 624 0" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M392 426a208 208 0 0 1 416 0" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /><path d="M600 426l166-132" stroke="#2a2431" strokeWidth={16} strokeLinecap="round" /><circle cx={600} cy={426} r={28} fill="var(--module-artwork-accent, #385d7a)" /></g>;
}

function ClusterSymbol() {
  const cells = [[420, 240], [600, 240], [780, 240], [510, 396], [690, 396]] as const;
  return <g>{cells.map(([cx, cy]) => <path key={`${cx}-${cy}`} d={`M${cx} ${cy - 78}l68 39v78l-68 39-68-39v-78z`} fill="#fff" stroke="#2a2431" strokeWidth={6} />)}<path d="M488 279h44M668 279h44M555 372h90" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" /></g>;
}

function FinopsSymbol() {
  return <g><rect x={280} y={448} width={110} height={76} rx={16} fill="#fff" stroke="#2a2431" strokeWidth={6} /><rect x={450} y={358} width={110} height={166} rx={16} fill="#fff" stroke="#2a2431" strokeWidth={6} /><rect x={620} y={260} width={110} height={264} rx={16} fill="#fff" stroke="#2a2431" strokeWidth={6} /><rect x={790} y={318} width={110} height={206} rx={16} fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={335} cy={304} r={60} fill="var(--module-artwork-accent, #385d7a)" opacity=".72" /><circle cx={872} cy={204} r={60} fill="var(--module-artwork-accent, #385d7a)" opacity=".44" /></g>;
}

function ObservabilitySymbol() {
  return <g><rect x={260} y={164} width={680} height={360} rx={24} fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M314 420c82-120 152-26 214-106 66-84 126 72 200-20 44-56 82-80 150-88" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={16} strokeLinecap="round" /><circle cx={728} cy={294} r={58} fill="none" stroke="#2a2431" strokeWidth={10} /><path d="M768 334l82 82" stroke="#2a2431" strokeWidth={12} strokeLinecap="round" /></g>;
}

function ReliabilitySymbol() {
  return <g><path d="M600 142l258 80v168c0 112-104 190-258 236-154-46-258-124-258-236V222z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M490 382l72 72 160-188" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /></g>;
}

function PythonTestSymbol() {
  return <g><Card x={250} y={190} w={330} h={300}><path d="M328 296l-52 52 52 52M500 296l52 52-52 52" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /></Card><Card x={640} y={190} w={310} h={300}>{[286, 356, 426].map((y) => <path key={y} d={`M700 ${y}l30 30 66-82`} fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />)}</Card></g>;
}

function BundleSymbol() {
  return <g><path d="M600 146l260 150v228L600 646 340 524V296z" fill="#fff" stroke="#2a2431" strokeWidth={6} /><path d="M340 296l260 130 260-130M600 426v220" fill="none" stroke="#2a2431" strokeWidth={6} /><path d="M600 222l86 50-86 50-86-50z" fill="var(--module-artwork-accent, #385d7a)" opacity=".78" /></g>;
}

function PrivacySymbol() {
  return <g><path d="M430 300v-62c0-96 72-164 170-164s170 68 170 164v62" fill="none" stroke="#2a2431" strokeWidth={18} strokeLinecap="round" /><rect x={360} y={300} width={480} height={250} rx={28} fill="#fff" stroke="#2a2431" strokeWidth={6} /><circle cx={600} cy={400} r={44} fill="var(--module-artwork-accent, #385d7a)" /><path d="M600 444v56" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={18} strokeLinecap="round" /></g>;
}

function SharingSymbol() {
  const nodes = [[310, 330], [500, 210], [700, 450], [890, 330]] as const;
  return <g>{nodes.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={72} fill="#fff" stroke="#2a2431" strokeWidth={6} />)}<path d="M372 292l66-42M548 274l104 124M772 412l62-42M382 364l256 62" fill="none" stroke="var(--module-artwork-accent, #385d7a)" strokeWidth={14} strokeLinecap="round" /><circle cx={600} cy={330} r={42} fill="var(--module-artwork-accent, #385d7a)" opacity=".72" /></g>;
}
