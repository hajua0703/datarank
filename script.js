const SUPABASE_URL = 'https://zwgznwoywgvlyujbmdwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRender();    // 페이지 로드 시 기존 데이터 표시
    subscribeToChanges(); // 실시간 데이터 감시 시작
});

// 데이터 가져오기 및 표 그리기
async function fetchAndRender() {
    const { data, error } = await _supabase
        .from('race_results')
        .select('*')
        .order('round_no', { ascending: true });

    if (error) {
        console.error('데이터 로드 실패:', error);
        return;
    }
    renderTable(data);
}

function renderTable(data) {
    const headerRow = document.getElementById('header-row');
    const tableBody = document.querySelector('#result-table tbody');

    // 1. 최대 라운드 계산
    const maxRound = data.length > 0 ? Math.max(...data.map(d => d.round_no)) : 0;

    // 2. 헤더 업데이트 (라운드 수만큼 열 생성)
    headerRow.innerHTML = '<th class="sticky-col">말 정보 / 라운드</th>';
    for (let r = 1; r <= maxRound; r++) {
        headerRow.innerHTML += `<th>Rd ${r}</th>`;
    }

    // 3. 1~10번 말 행 생성
    let bodyHtml = '';
    for (let h = 1; h <= 10; h++) {
        // 이미지 파일명이 horse1.png, horse2.png 형식이므로 이에 맞춰 설정
        bodyHtml += `
            <tr>
                <td class="sticky-col">
                    <div class="horse-info">
                        <img src="horse${h}.png" alt="Horse ${h}" class="horse-icon" onerror="this.src='https://via.placeholder.com/40?text=H'">
                        <span class="horse-name">${h}번 말</span>
                    </div>
                </td>`;

        for (let r = 1; r <= maxRound; r++) {
            const result = data.find(d => d.round_no === r && d.horse_no === h);
            
            if (result && result.rank <= 3) {
                bodyHtml += `<td><span class="rank rank-${result.rank}">${result.rank}</span></td>`;
            } else {
                bodyHtml += `<td></td>`; // 4등 이하는 빈칸
            }
        }
        bodyHtml += `</tr>`;
    }
    tableBody.innerHTML = bodyHtml;
}

// Supabase 실시간 구독 기능
function subscribeToChanges() {
    _supabase
        .channel('public:race_results')
        .on('postgres_changes', { event: 'INSERT', table: 'race_results' }, (payload) => {
            console.log('새로운 결과 수신:', payload.new);
            fetchAndRender(); // 데이터 추가 시 다시 렌더링
        })
        .subscribe();
}