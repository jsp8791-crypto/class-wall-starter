// ===================================================
// 우리 반 담벼락 - Firestore 연동
// Firebase SDK v9+ modular 방식을 사용합니다 (CDN ES Module).
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyCQYAEqCLANfWBooxwBE_Q78cOvnxJ1oZM",
  authDomain: "cdh-2e4eb.firebaseapp.com",
  projectId: "cdh-2e4eb",
  storageBucket: "cdh-2e4eb.firebasestorage.app",
  messagingSenderId: "955379874074",
  appId: "1:955379874074:web:691932ce029ab5289694a3"
};

// Firebase 및 Firestore 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 메모 목록 (Firestore와 실시간 동기화됨)
let memos = [];


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

// 메모를 새로 씁니다. (5글자 이상만 저장)
async function addMemo(text) {
  if (text.length < 5) {
    alert("메모는 5글자 이상 입력해 주세요.");
    return;
  }

  const newMemo = {
    text: text,
    createdAt: Date.now()
  };

  try {
    // Firestore 'memos' 컬렉션에 새 문서 추가
    await addDoc(collection(db, "memos"), newMemo);
  } catch (err) {
    console.error("메모 저장 실패:", err);
    alert("메모 저장 중 오류가 발생했습니다: " + err.message);
  }
}

// 메모를 지웁니다.
async function deleteMemo(id) {
  try {
    // Firestore 문서 삭제
    await deleteDoc(doc(db, "memos", String(id)));
  } catch (err) {
    console.error("메모 삭제 실패:", err);
    alert("메모 삭제 중 오류가 발생했습니다: " + err.message);
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
  // 인라인 onclick 대신 addEventListener 사용
  del.addEventListener("click", async function () {
    await deleteMemo(memo.id);
  });
  div.appendChild(del);

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}

// Firestore 실시간 리스너 (새 메모 작성 및 삭제 실시간 반영)
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


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

// 인라인 onkeydown 대신 addEventListener 사용
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const text = input.value.trim();
    if (text === "") return;

    addMemo(text);
    input.value = "";
  }
});


// 첫 화면 그리기 및 포커스
render();
input.focus();
