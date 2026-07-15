/**
 * Wipe community notes and seed 2 demo public skin notes.
 * Usage: node scripts/seed-demo-notes.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://ppxjklwepownrdyboaaj.supabase.co";
const SERVICE_ROLE_KEY = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweGprbHdlcG93bnJkeWJvYWFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU2OTIxMSwiZXhwIjoyMDk5MTQ1MjExfQ.",
  "UWEMyYLVEqCVmwG4Gaay5F2QDWqnwQiubYTP0ona2EE",
].join("");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "AnaSeed2026!";
const BUCKET = "seed-assets";

function storageUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

const AUTHORS = [
  {
    key: "maha",
    email: "seed-maha@ana.demo",
    nickname: "나는야 마하영",
    ageGroup: "20대",
    gender: "여성",
    avatar: "/illustrations/avatar-2.svg",
    skinType: "지성",
    sensitivity: "높음",
    concerns: ["여드름/트러블", "민감/붉음증"],
  },
  {
    key: "gamja",
    email: "seed-gamja@ana.demo",
    nickname: "감자돌이",
    ageGroup: "20대",
    gender: null,
    avatar: "/illustrations/avatar-4.svg",
    skinType: "복합성",
    sensitivity: "보통",
    concerns: ["색소침착", "미백/칙칙함"],
  },
];

async function ensureUser(author) {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data?.users?.find((u) => u.email === author.email);
  let userId = existing?.id;
  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email: author.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { nickname: author.nickname },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    console.log("created auth user", author.nickname, userId);
  } else {
    console.log("reuse auth user", author.nickname, userId);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    user_id: userId,
    email: author.email,
    nickname: author.nickname,
    age_group: author.ageGroup,
    gender: author.gender,
    avatar_url: author.avatar,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;

  const { error: skinError } = await admin.from("skin_profiles").upsert({
    user_id: userId,
    skin_type: author.skinType,
    concerns: author.concerns,
    sensitivity: author.sensitivity,
    updated_at: new Date().toISOString(),
  });
  if (skinError) throw skinError;

  return userId;
}

async function wipeCommunity() {
  // child tables first where no cascade from notes isn't enough for orphaned rows
  const tables = [
    "comment_likes",
    "note_reports",
    "note_hides",
    "note_helps",
    "note_saves",
    "note_comments",
    "skin_notes",
  ];
  for (const table of tables) {
    const { error } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // some tables use composite PK without id
    if (error) {
      const { error: err2 } = await admin
        .from(table)
        .delete()
        .gte("created_at", "1970-01-01");
      if (err2) console.warn("wipe warn", table, err2.message);
      else console.log("wiped", table);
    } else {
      console.log("wiped", table);
    }
  }
}

async function main() {
  console.log("Wiping community notes…");
  await wipeCommunity();

  const mahaId = await ensureUser(AUTHORS[0]);
  const gamjaId = await ensureUser(AUTHORS[1]);

  const now = new Date();
  const mahaNoteId = randomUUID();
  const gamjaNoteId = randomUUID();

  const notes = [
    {
      id: mahaNoteId,
      author_id: mahaId,
      author_nickname: "나는야 마하영",
      author_avatar: "/illustrations/avatar-2.svg",
      skin_type: "지성",
      concerns: ["여드름/트러블", "민감/붉음증"],
      sensitivity: "높음",
      age_group: "20대",
      title: "14일 사용 후기",
      tags: ["여드름진정", "장벽 진정", "트러블 진정", "피부결 개선"],
      products: [
        {
          id: "maha-cleanser",
          name: "아누아 어성초 포어 컨트롤 클렌징 오일",
          brand: "아누아",
          category: "클렌징",
          imageUrl: storageUrl("maha/cleanser.png"),
        },
        {
          id: "maha-toner",
          name: "아누아 어성초 77 토너 패드",
          brand: "아누아",
          category: "토너",
          imageUrl: storageUrl("maha/toner.png"),
        },
        {
          id: "maha-serum",
          name: "토리든 밸런스풀 시카 세럼",
          brand: "토리든",
          category: "세럼",
          imageUrl: storageUrl("maha/serum.png"),
        },
        {
          id: "maha-cream",
          name: "Dr.G 레드 블레미쉬 수딩 크림",
          brand: "Dr.G",
          category: "크림",
          imageUrl: storageUrl("maha/cream.png"),
        },
      ],
      duration_days: 14,
      difficulty: "보통이에요",
      felt_change: 4,
      end_reason: "변화가 느껴져서 마칠래요",
      change_timeline: [
        {
          label: "7일차",
          photoUrl: storageUrl("maha/day7.png"),
          feeling: "변화가 있었어요",
        },
        {
          label: "14일차",
          photoUrl: storageUrl("maha/day14.png"),
          feeling: "변화가 있었어요",
        },
      ],
      visibility: "public",
      is_abandoned: false,
      save_count: 12,
      help_count: 8,
      comment_count: 3,
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: gamjaNoteId,
      author_id: gamjaId,
      author_nickname: "감자돌이",
      author_avatar: "/illustrations/avatar-4.svg",
      skin_type: "복합성",
      concerns: ["색소침착", "미백/칙칙함"],
      sensitivity: "보통",
      age_group: "20대",
      title: "21일 사용 후기",
      tags: ["색소침착 완화", "피부톤 개선"],
      products: [
        {
          id: "gamja-cleanser",
          name: "토리든 다이브인 클렌징 폼",
          brand: "토리든",
          category: "클렌징",
          imageUrl: storageUrl("gamja/cleanser.png"),
        },
        {
          id: "gamja-toner",
          name: "넘버즈인 5번 글루타치온C 흔적 앰플 토너",
          brand: "넘버즈인",
          category: "토너",
          imageUrl: storageUrl("gamja/toner.png"),
        },
        {
          id: "gamja-serum",
          name: "넘버즈인 5번 글루타치온C 흔적 앰플",
          brand: "넘버즈인",
          category: "세럼",
          imageUrl: storageUrl("gamja/serum.png"),
        },
        {
          id: "gamja-cream",
          name: "구달 청귤 비타C 잡티케어 크림",
          brand: "구달",
          category: "크림",
          imageUrl: storageUrl("gamja/cream.png"),
        },
      ],
      duration_days: 21,
      difficulty: "쉬웠어요",
      felt_change: 5,
      end_reason: "변화가 느껴져서 마칠래요",
      change_timeline: [
        {
          label: "7일차",
          photoUrl: storageUrl("gamja/day7.png"),
          feeling: "변화가 있었어요",
        },
        {
          label: "14일차",
          photoUrl: storageUrl("gamja/day14.png"),
          feeling: "변화가 있었어요",
        },
        {
          label: "21일차",
          photoUrl: storageUrl("gamja/day21.png"),
          feeling: "변화가 있었어요",
        },
      ],
      visibility: "public",
      is_abandoned: false,
      save_count: 9,
      help_count: 15,
      comment_count: 6,
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ];

  const { error } = await admin.from("skin_notes").insert(notes);
  if (error) throw error;

  const { count } = await admin
    .from("skin_notes")
    .select("*", { count: "exact", head: true })
    .eq("visibility", "public");

  console.log("Seeded notes. public count =", count);
  console.log("maha:", mahaNoteId);
  console.log("gamja:", gamjaNoteId);
  console.log("Done. Hard-refresh the app (clear localStorage ana-skin-state-v3 if needed).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
