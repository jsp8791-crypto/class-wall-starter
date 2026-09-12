// ===================================================
// Gemini에게 물어보는 Vercel 서버리스 함수 (/api/gemini)
//
// 규칙 준수:
//   - Firebase Spark 무료 요금제 유지를 위해 Vercel Serverless Function 사용
//   - 무료 티어로 제공되는 최신 gemini-2.5-flash 모델 사용
//   - API 키는 process.env.GEMINI_API_KEY 로 안전하게 꺼내 씀
//   - 학생 식별 정보(UID, 이름) 없이 메모 본문 텍스트만 처리
// ===================================================

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Vercel 환경변수에 GEMINI_API_KEY가 설정되어 있지 않습니다."
    });
  }

  const { memos } = req.body || {};
  if (!memos || !Array.isArray(memos) || memos.length === 0) {
    return res.status(400).json({
      error: "분석할 메모 내용이 없습니다."
    });
  }

  // Gemini 프롬프트 구성 (따뜻한 격려와 수업 피드백 코멘트 요청)
  const memoListText = memos.map((text, idx) => `${idx + 1}. ${text}`).join("\n");
  const prompt = `
당신은 다정하고 지혜로운 초·중등 학급 담임 선생님입니다.
아래는 학생들이 우리 반 담벼락에 남긴 실시간 메모들입니다:

${memoListText}

위 학생들의 메모를 종합적으로 살펴보고, 담임 선생님으로서 전체 학생들에게 전하는 따뜻한 격려와 칭찬, 그리고 수업에 대한 의미 있는 총평 코멘트를 3~4문장으로 다정하게 작성해 주세요. 
이모지를 자연스럽게 곁들여 교실 담벼락에 바로 게시할 수 있는 말투(~했단다, ~하네요 등)로 작성해 주세요.
`;

  try {
    // 무료 제공 모델인 gemini-2.5-flash 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `Gemini API 에러: ${response.status}`);
    }

    const data = await response.json();
    const comment = data.candidates?.[0]?.content?.parts?.[0]?.text || "코멘트를 생성하지 못했습니다.";

    return res.status(200).json({ comment });
  } catch (error) {
    console.error("Gemini API 호출 실패:", error);
    return res.status(500).json({
      error: "Gemini 코멘트 생성 중 오류가 발생했습니다: " + error.message
    });
  }
}
