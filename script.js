const SUPABASE_URL = 'https://zwgznwoywgvlyujbmdwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z3pud295d2d2bHl1amJtZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTEyNTMsImV4cCI6MjA4MTUyNzI1M30.m_7wSDQZLNFgJzY5Xq4HcJbCJmRyp9D4s4wTWtNp0Mc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRender();    
    subscribeToChanges(); 
});

async function fetchAndRender() {
    try {
        // round 기준 내림차순 정렬하여 최신순으로 가져옴
        const { data, error } = await _supabase
            .from('race_results')
            .select('*')
            .order('round', { ascending: false });

        if (error) throw error;

        // 최신 10개 라운드만 추출
        const latestTenRounds = data ? data.slice(0, 10) : [];
        renderTable(latestTenRounds);
    } catch (err) {
        console.error('데이터 로드 실패:', err);
        renderTable([]);
    }
}

function renderTable(data) {
    const headerRow = document.getElementById('header-row');
    const tableBody = document.querySelector('#result-table tbody');

    // 1. 헤더 생성: 최신순으로 정렬된 10개 라운드만 표시
    headerRow.innerHTML = '<th class="sticky-col">말 정보 / 라운드</th>';
    data.forEach(row => {
        headerRow.innerHTML += `<th>${row.round}R</th>`;
    });

    // 2. 1~10번 말 행 생성
    let bodyHtml = '';
    for (let horseNum = 1; horseNum <= 10; horseNum++) {
        bodyHtml += `
            <tr>
                <td class="sticky-col">
                    <div class="horse-info">
                        <img src="말${horseNum}.png" alt="말 ${horseNum}" class="horse-icon" onerror="this.src='https://via.placeholder.com/40?text=${horseNum}'">
                        <span class="horse-name">${horseNum}번 말</span>
                    </div>
                </td>`;

        // 화면에 있는 10개 라운드에 대해서만 등수 확인
        data.forEach(row => {
            const rankArray = row.ranks.split(',').map(id => id.trim());
            const horseRank = rankArray.findIndex(id => Number(id) === horseNum) + 1;

            // 1~3등만 표시
            if (horseRank >= 1 && horseRank <= 3) {
                bodyHtml += `<td><span class="rank rank-${horseRank}">${horseRank}</span></td>`;
            } else {
                bodyHtml += `<td></td>`;
            }
        });
        bodyHtml += `</tr>`;
    }
    tableBody.innerHTML = bodyHtml;
}

function subscribeToChanges() {
    _supabase
        .channel('public:race_results')
        .on('postgres_changes', { event: 'INSERT', table: 'race_results', schema: 'public' }, (payload) => {
            fetchAndRender(); 
        })
        .subscribe();
}