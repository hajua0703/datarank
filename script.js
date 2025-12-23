// 1. Supabase 설정 (본인의 정보를 입력하세요)
const SUPABASE_URL = 'https://zwgznwoywgvlyujbmdwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. 초기 로드 및 실시간 구독 시작
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRender();
    subscribeToResults();
});

// 3. 데이터 가져오기 및 표 렌더링
async function fetchAndRender() {
    const { data, error } = await _supabase
        .from('race_results')
        .select('*')
        .order('round_no', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    renderTable(data);
}

// 4. 표 렌더링 로직
function renderTable(data) {
    const headerRow = document.getElementById('header-row');
    const tableBody = document.querySelector('#result-table tbody');

    // 현재 저장된 최대 라운드 계산
    const maxRound = data.length > 0 ? Math.max(...data.map(d => d.round_no)) : 0;

    // 헤더 초기화 및 라운드 생성
    headerRow.innerHTML = '<th class="horse-no">말 번호 / 라운드</th>';
    for (let r = 1; r <= maxRound; r++) {
        headerRow.innerHTML += `<th>Rd ${r}</th>`;
    }

    // 1번부터 10번 말까지 행 생성
    let bodyHtml = '';
    for (let h = 1; h <= 10; h++) {
        bodyHtml += `<tr><td class="horse-no">${h}번 말</td>`;
        
        for (let r = 1; r <= maxRound; r++) {
            // 해당 라운드와 말 번호에 맞는 결과 찾기
            const result = data.find(d => d.round_no === r && d.horse_no === h);
            
            if (result && result.rank <= 3) {
                bodyHtml += `<td><div class="rank-${result.rank}">${result.rank}</div></td>`;
            } else {
                bodyHtml += `<td></td>`; // 4등 이하는 빈칸
            }
        }
        bodyHtml += `</tr>`;
    }
    tableBody.innerHTML = bodyHtml;
}

// 5. Supabase 실시간 구독 (트랙 사이트에서 INSERT 발생 시 자동 갱신)
function subscribeToResults() {
    _supabase
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            { event: 'INSERT', table: 'race_results', schema: 'public' },
            (payload) => {
                console.log('새로운 결과가 추가되었습니다:', payload.new);
                fetchAndRender(); // 데이터가 추가되면 표를 다시 그림
            }
        )
        .subscribe();
}