// 1. 본인의 Supabase 정보로 꼭 교체하세요!
const SUPABASE_URL = 'https://zwgznwoywgvlyujbmdwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRender();    
    subscribeToChanges(); 
});

async function fetchAndRender() {
    try {
        const { data, error } = await _supabase
            .from('race_results')
            .select('*')
            .order('round_no', { ascending: true });

        if (error) throw error;
        renderTable(data || []);
    } catch (err) {
        console.error('데이터 로드 실패:', err);
        renderTable([]); // 에러가 나도 빈 배열로 표의 틀은 그리도록 함
    }
}

function renderTable(data) {
    const headerRow = document.getElementById('header-row');
    const tableBody = document.querySelector('#result-table tbody');

    // 데이터가 있으면 최대 라운드 계산, 없으면 0
    const maxRound = data.length > 0 ? Math.max(...data.map(d => d.round_no)) : 0;

    // 1. 헤더: 라운드 표시 (데이터가 없어도 기본 헤더는 유지)
    headerRow.innerHTML = '<th class="sticky-col">말 정보 / 라운드</th>';
    for (let r = 1; r <= maxRound; r++) {
        headerRow.innerHTML += `<th>Rd ${r}</th>`;
    }

    // 2. 1~10번 말 행 무조건 생성
    let bodyHtml = '';
    for (let h = 1; h <= 10; h++) {
        bodyHtml += `
            <tr>
                <td class="sticky-col">
                    <div class="horse-info">
                        <img src="말${h}.png" alt="말 ${h}" class="horse-icon" onerror="this.src='https://via.placeholder.com/40?text=?'">
                        <span class="horse-name">${h}번 말</span>
                    </div>
                </td>`;

        // 라운드 결과 채우기
        for (let r = 1; r <= maxRound; r++) {
            const result = data.find(d => d.round_no === r && d.horse_no === h);
            if (result && result.rank <= 3) {
                bodyHtml += `<td><span class="rank rank-${result.rank}">${result.rank}</span></td>`;
            } else {
                bodyHtml += `<td></td>`;
            }
        }
        bodyHtml += `</tr>`;
    }
    tableBody.innerHTML = bodyHtml;
}

function subscribeToChanges() {
    _supabase
        .channel('public:race_results')
        .on('postgres_changes', { event: 'INSERT', table: 'race_results' }, (payload) => {
            console.log('새 결과 도착:', payload.new);
            fetchAndRender(); 
        })
        .subscribe();
}