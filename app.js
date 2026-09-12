// ===================================================
// 우리 반 담벼락 - Firestore 연동
// Firebase SDK v9 modular 방식을 사용합니다.
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Firebase 콘솔에서 발급받은 설정값을 아래 객체에 입력하세요.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firestore 인스턴스 초기화
let db = null;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (err) {
  console.warn("Firestore 초기화 대기 중: 올바른 firebaseConfig를 입력해 주세요.", err);
}

// 로컬 임시 메모 목록 (Firebase 연동 전 또는 오프라인 fallback용)
let memos = [
  { id: "1", text: "오늘 과학 시간에 한 실험이 재미있었다", createdAt: 1757030400000 },
  { id: "2", text: "궁금한 점 - 물은 왜 100도에서 끓나요?", createdAt: 1757030500000 },
  { id: "3", text: "모둠 친구들이 도와줘서 고마웠다", createdAt: 1757030600000 }
];

let nextId = 4;


// ===================================================
// 데이터를 다루는 함수 세 개
// Firestore를 사용하며, 기존 함수명과 역할을 그대로 유지합니다.
// ===================================================

// 메모를 읽어 옵니다. (createdAt 기준 오름차순 정렬)
function loadMemos() {
  return memos.slice().sort(function (a, b) {
    return a.createdAt - b.createdAt;
  });
}

// 메모를 새로 씁니다.
async function addMemo(text) {
  const newMemo = {
    text: text,
    createdAt: Date.now()
  };

  if (db) {
    try {
      // Firestore 'memos' 컬렉션에 새 문서 추가
      await addDoc(collection(db, "memos"), newMemo);
    } catch (err) {
      console.error("메모 저장 실패:", err);
      alert("메모 저장 중 오류가 발생했습니다: " + err.message);
    }
  } else {
    // Firebase 미연동 시 로컬 배열에 추가
    memos.push({
      id: String(nextId++),
      ...newMemo
    });
    render();
  }
}

// 메모를 지웁니다.
async function deleteMemo(id) {
  if (db) {
    try {
      // Firestore 문서 삭제
      await deleteDoc(doc(db, "memos", String(id)));
    } catch (err) {
      console.error("메모 삭제 실패:", err);
      alert("메모 삭제 중 오류가 발생했습니다: " + err.message);
    }
  } else {
    // Firebase 미연동 시 로컬 배열에서 삭제
    memos = memos.filter(function (memo) {
      return memo.id !== id;
    });
    render();
  }
}


// ===================================================
// 화면 그리기 및 실시간 동기화
// ===================================================

function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  loadMemos().forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  const del = document.createElement("button");
  del.textContent = "×";
  del.title = "메모 삭제";
  del.onclick = async function () {
    await deleteMemo(memo.id);
  };
  div.appendChild(del);

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}

// Firestore 실시간 리스너 (db 연결 시)
if (db) {
  // createdAt 기준으로 오름차순 정렬하여 구독
  const q = query(collection(db, "memos"), orderBy("createdAt", "asc"));
  onSnapshot(q, function (snapshot) {
    memos = snapshot.docs.map(function (docSnap) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    });
    render();
  }, function (err) {
    console.error("Firestore 실시간 동기화 오류:", err);
  });
}


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

input.onkeydown = function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const text = input.value.trim();
    if (text === "") return;

    addMemo(text);
    input.value = "";
    render();
  }
};


// 첫 화면 그리기
render();
input.focus();
