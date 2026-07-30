(function(){
  const USERNAME = "Daksh12345-del";
  const termBody = document.getElementById('termBody');
  const cmdInput = document.getElementById('cmdInput');
  let CONTRIB_DAYS = [];

  // ---------- 5x7 bitmap font for block-letter name ----------
  const FONT = {
    'D': ['11110','10001','10001','10001','10001','10001','11110'],
    'A': ['01110','10001','10001','11111','10001','10001','10001'],
    'K': ['10001','10010','10100','11000','10100','10010','10001'],
    'S': ['01111','10000','10000','01110','00001','00001','11110'],
    'H': ['10001','10001','10001','11111','10001','10001','10001'],
    'I': ['11111','00100','00100','00100','00100','00100','11111'],
    'N': ['10001','11001','10101','10101','10011','10001','10001'],
    'G': ['01111','10000','10000','10011','10001','10001','01111'],
    'L': ['10000','10000','10000','10000','10000','10000','11111'],
    ' ': ['000','000','000','000','000','000','000'],
  };

  function lerp(a, b, t){ return Math.round(a + (b - a) * t); }
  function hexToRgb(hex){
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r,g,b){
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  }
  function gradientColor(t){
    // cream -> amber-bright -> rust across the width
    const cream = hexToRgb('#f3e9d2');
    const amber = hexToRgb('#ffd166');
    const rust  = hexToRgb('#ff6a3d');
    if(t < 0.5){
      const tt = t / 0.5;
      return rgbToHex(lerp(cream[0],amber[0],tt), lerp(cream[1],amber[1],tt), lerp(cream[2],amber[2],tt));
    } else {
      const tt = (t - 0.5) / 0.5;
      return rgbToHex(lerp(amber[0],rust[0],tt), lerp(amber[1],rust[1],tt), lerp(amber[2],rust[2],tt));
    }
  }

  function renderAsciiBlockName(text){
    const el = document.getElementById('asciiBlockName');
    if(!el) return;
    const letters = text.toUpperCase().split('');
    const rows = 7;
    const grid = new Array(rows).fill('');
    let totalWidth = 0;

    letters.forEach(ch => {
      const bitmap = FONT[ch] || FONT[' '];
      const w = bitmap[0].length;
      for(let r = 0; r < rows; r++){
        grid[r] += bitmap[r] + '0'; // 1-column gap between letters
      }
      totalWidth += w + 1;
    });

    let html = '';
    for(let r = 0; r < rows; r++){
      for(let c = 0; c < totalWidth; c++){
        const on = grid[r][c] === '1';
        if(on){
          const color = gradientColor(c / totalWidth);
          html += '<span style="color:' + color + '">█</span>';
        } else {
          html += ' ';
        }
      }
      html += '\n';
    }
    el.innerHTML = html;
  }

  renderAsciiBlockName('DAKSH SINGHAL');

  function addLine(html, cls){
    const div = document.createElement('div');
    div.className = 'line ' + (cls || 'out');
    div.innerHTML = html;
    termBody.appendChild(div);
    return div;
  }

  function promptLine(cmd){
    return '<span class="prompt-user">daksh</span><span class="prompt-sep">@</span><span class="prompt-path">github</span><span class="prompt-sep">:~$</span> <span class="cmd-text">' + cmd + '</span>';
  }

  // ---------- typing boot sequence ----------
  const boot = [
    { html: promptLine('whoami'), cls: 'line' },
    { html: 'Full-Stack Developer · B.Tech CSE Undergraduate, ABES Engineering College (AKTU)', cls: 'out cream' },
    { html: 'Founder @ GradeWallah · IT Trainee @ BLS International · New Delhi, India', cls: 'out' },
    { html: 'Open-source: GSSoC \'25 · Hacktoberfest \'25 · Ships real products, solo, to production', cls: 'out dim' },
  ];

  let bootIndex = 0;
  function typeNextLine(){
    if(bootIndex >= boot.length){
      cmdInput.focus();
      return;
    }
    const item = boot[bootIndex];
    const el = addLine('', item.cls);
    typeInto(el, item.html, function(){
      bootIndex++;
      setTimeout(typeNextLine, 160);
    });
  }

  function typeInto(el, html, done){
    // support instant render for prefers-reduced-motion
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ el.innerHTML = html; done && done(); return; }

    let i = 0;
    const raw = html;
    function step(){
      i += Math.max(1, Math.floor(raw.length / 60));
      el.innerHTML = raw.slice(0, i);
      if(i < raw.length){
        requestAnimationFrame(() => setTimeout(step, 8));
      } else {
        el.innerHTML = raw;
        done && done();
      }
    }
    step();
  }

  typeNextLine();

  // ---------- command history ----------
  const CMD_HISTORY = [];

  // ---------- theme switching ----------
  const THEMES = {
    amber: { amber:'#ffb000', amberDim:'#a86e10', amberBright:'#ffd166', rust:'#ff6a3d', cream:'#f3e9d2', muted:'#8a7358', line:'#3a2c17', bg:'#0b0906', bgPanel:'#15100a', label:'amber (default)' },
    green: { amber:'#33ff77', amberDim:'#1f8a48', amberBright:'#9dffb0', rust:'#00e5ff', cream:'#d8ffe0', muted:'#4f7a5a', line:'#123322', bg:'#050a06', bgPanel:'#0b140d', label:'matrix green' },
    blue:  { amber:'#4fc3ff', amberDim:'#2a6f96', amberBright:'#b3e5ff', rust:'#ff477e', cream:'#eaf6ff', muted:'#557a99', line:'#16324a', bg:'#050b12', bgPanel:'#0c1826', label:'cyberpunk blue' },
  };
  const THEME_ORDER = ['amber', 'green', 'blue'];
  let themeIndex = 0;

  function applyTheme(name){
    const t = THEMES[name];
    if(!t) return;
    const root = document.documentElement.style;
    root.setProperty('--amber', t.amber);
    root.setProperty('--amber-dim', t.amberDim);
    root.setProperty('--amber-bright', t.amberBright);
    root.setProperty('--rust', t.rust);
    root.setProperty('--cream', t.cream);
    root.setProperty('--muted', t.muted);
    root.setProperty('--line', t.line);
    root.setProperty('--bg', t.bg);
    root.setProperty('--bg-panel', t.bgPanel);
    renderAsciiBlockName('DAKSH SINGHAL');
  }

  // ---------- matrix rain effect ----------
  const matrixCanvas = document.getElementById('matrixCanvas');
  let matrixRunning = false;
  function runMatrixRain(durationMs){
    const ctx = matrixCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    function resize(){
      matrixCanvas.width = window.innerWidth * dpr;
      matrixCanvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const chars = 'アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJK'.split('');
    const fontSize = 15;
    const columns = Math.floor(window.innerWidth / fontSize);
    const drops = new Array(columns).fill(1);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#ffb000';

    matrixCanvas.classList.add('active');
    matrixRunning = true;
    const start = performance.now();

    function draw(now){
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = color;
      ctx.font = fontSize + 'px monospace';
      for(let i = 0; i < drops.length; i++){
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if(drops[i] * fontSize > window.innerHeight && Math.random() > 0.975){
          drops[i] = 0;
        }
        drops[i]++;
      }
      if(now - start < durationMs){
        requestAnimationFrame(draw);
      } else {
        matrixCanvas.classList.remove('active');
        setTimeout(() => {
          ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
          matrixRunning = false;
        }, 650);
      }
    }
    requestAnimationFrame(draw);
  }

  // ---------- live GitHub stats ----------
  async function loadStats(){
    try{
      const userRes = await fetch('https://api.github.com/users/' + USERNAME);
      const user = await userRes.json();
      document.getElementById('statRepos').textContent = user.public_repos ?? '—';
    }catch(e){
      document.getElementById('statRepos').textContent = 'n/a';
    }

    try{
      const contribRes = await fetch('https://github-contributions-api.jogruber.de/v4/' + USERNAME);
      const data = await contribRes.json();
      const days = data.contributions || [];
      CONTRIB_DAYS = days;
      const total = days.reduce((s, d) => s + (d.count || 0), 0);

      let best = 0, run = 0;
      for(const d of days){
        if(d.count > 0){ run++; best = Math.max(best, run); }
        else{ run = 0; }
      }

      let current = 0;
      for(let i = days.length - 1; i >= 0; i--){
        if(days[i].count > 0) current++;
        else break;
      }

      document.getElementById('statContrib').textContent = total.toLocaleString();
      document.getElementById('statStreak').textContent = current;
      document.getElementById('statBest').textContent = best;
    }catch(e){
      document.getElementById('statContrib').textContent = 'n/a';
      document.getElementById('statStreak').textContent = 'n/a';
      document.getElementById('statBest').textContent = 'n/a';
    }
  }
  loadStats();

  // ---------- interactive commands ----------
  const PROJECTS = [
    ['GradeWallah', 'SaaS for SGPA/CGPA tracking & analytics', 'gradewallah.com'],
    ['Sarvpratham Edu Consultants', 'College admission & counselling platform (client)', 'sarvprathameduconsultants.com'],
    ['Prime Builders', 'Real-estate discovery platform (client)', 'primebuilders.co.in'],
    ['DU College Predictor', 'CUET-based DU admission predictor', 'sarvprathameduconsultants.com/college-predictor.html'],
    ['BLS Visa Portal', 'Multi-step visa flow + admin panel (internship)', 'github.com/Daksh12345-del/BLS_USER_INTERNSHIP'],
    ['GreenPrint', 'Live carbon/ESG scoring platform', 'green-print-frontend.vercel.app'],
  ];

  const SKILLS = {
    'Languages': ['JavaScript', 'Java', 'C++', 'HTML5', 'CSS3'],
    'Frontend': ['React', 'Tailwind CSS', 'Vite', 'Framer Motion'],
    'Backend & Data': ['Node.js', 'Express.js', 'PostgreSQL', 'Supabase', 'AWS'],
    'Testing & Tools': ['Selenium', 'Git', 'Postman', 'VS Code'],
  };

  function printProjects(){
    addLine(promptLine('projects'));
    PROJECTS.forEach(([name, desc, link], i) => {
      addLine((i+1) + '. <span class="out cream">' + name + '</span> — ' + desc, 'out');
      addLine('   ↳ ' + link, 'out dim');
    });
  }

  function printSkills(){
    addLine(promptLine('skills'));
    Object.entries(SKILLS).forEach(([cat, list]) => {
      addLine(cat + ':', 'out cream');
      addLine('  ' + list.join(' · '), 'out dim');
    });
  }

  function printContact(){
    addLine(promptLine('contact'));
    addLine('email    → psinghal651@gmail.com', 'out');
    addLine('linkedin → linkedin.com/in/daksh-singhal-178b56282', 'out');
    addLine('github   → github.com/Daksh12345-del', 'out');
  }

  function printSudo(){
    addLine(promptLine('sudo'));
    addLine('[sudo] password for daksh: ', 'out dim');
    addLine('Nice try 😏 — you don\'t have root on this terminal.', 'out rust');
  }

  function printCoffee(){
    addLine(promptLine('coffee'));
    addLine('      ( (', 'out dim');
    addLine('       ) )', 'out dim');
    addLine('    ........', 'out');
    addLine('    |      |]', 'out');
    addLine('    \\      /', 'out');
    addLine('     `----\'', 'out');
    addLine('compiling… please hold, brewing chai ☕', 'out cream');
  }

  const JOKES = [
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"',
    '99 little bugs in the code, 99 little bugs. Take one down, patch it around — 127 little bugs in the code.',
    'Why did the developer go broke? Because he used up all his cache.',
    'There are only 10 types of people: those who understand binary, and those who don\'t.',
    '!false — it\'s funny because it\'s true.',
  ];
  function printJoke(){
    addLine(promptLine('joke'));
    const j = JOKES[Math.floor(Math.random() * JOKES.length)];
    addLine(j, 'out cream');
  }

  function printKonami(){
    addLine(promptLine('konami'));
    addLine('🏆 ACHIEVEMENT UNLOCKED: Terminal Explorer', 'out cream');
    addLine('You found the secret command. There\'s no prize, just respect.', 'out dim');
  }

  function openLink(cmd, url, label){
    addLine(promptLine(cmd));
    addLine('opening ' + label + ' in a new tab…', 'out dim');
    window.open(url, '_blank', 'noopener');
  }

  function printTheme(){
    addLine(promptLine('theme'));
    themeIndex = (themeIndex + 1) % THEME_ORDER.length;
    const name = THEME_ORDER[themeIndex];
    applyTheme(name);
    addLine('theme switched → ' + THEMES[name].label, 'out cream');
  }

  function printBanner(){
    addLine(promptLine('banner'));
    setTimeout(() => renderAsciiBlockName('DAKSH SINGHAL'), 30);
    addLine('banner reprinted above ↑', 'out dim');
  }

  function printDate(){
    addLine(promptLine('date'));
    const now = new Date();
    addLine(now.toDateString() + ' · ' + now.toLocaleTimeString(), 'out cream');
  }

  function printHistory(){
    addLine(promptLine('history'));
    if(CMD_HISTORY.length <= 1){
      addLine('no earlier commands yet.', 'out dim');
      return;
    }
    CMD_HISTORY.slice(0, -1).forEach((c, i) => addLine('  ' + (i+1) + '  ' + c, 'out dim'));
  }

  function printLs(){
    addLine(promptLine('ls'));
    addLine('total 6', 'out dim');
    [
      '-rw-r--r--  projects.md',
      '-rw-r--r--  skills.txt',
      '-rwxr-xr-x  contact.sh',
      '-rw-r--r--  resume.pdf',
      '-rw-r--r--  README.md',
      'drwxr-xr-x  .github/',
    ].forEach(l => addLine(l, 'out'));
  }

  function printMatrix(){
    addLine(promptLine('matrix'));
    if(matrixRunning){
      addLine('already inside the matrix…', 'out dim');
      return;
    }
    addLine('waking up, Neo…', 'out cream');
    runMatrixRain(5000);
  }

  const AMBER_LEVELS = ['#241a0d', '#5c3a10', '#8f5c14', '#c98518', '#ffb000'];
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function levelFromCount(count, max){
    if(count <= 0) return 0;
    if(max <= 0) return 1;
    const ratio = count / max;
    if(ratio > 0.75) return 4;
    if(ratio > 0.5) return 3;
    if(ratio > 0.25) return 2;
    return 1;
  }

  function printContributions(){
    addLine(promptLine('contributions'));

    if(!CONTRIB_DAYS.length){
      addLine('loading contribution data… try again in a moment.', 'out dim');
      return;
    }

    const days = CONTRIB_DAYS.slice();
    const maxCount = Math.max(...days.map(d => d.count || 0), 1);
    const total = days.reduce((s, d) => s + (d.count || 0), 0);

    // pad so the grid starts on a Sunday
    const firstDate = new Date(days[0].date + 'T00:00:00');
    const firstDow = firstDate.getDay(); // 0 = Sunday
    const padded = new Array(firstDow).fill(null).concat(days);

    // chunk into weeks of 7
    const weeks = [];
    for(let i = 0; i < padded.length; i += 7){
      weeks.push(padded.slice(i, i + 7));
    }

    // month labels: mark a week where a new month starts
    let lastMonth = -1;
    const monthLabelsHtml = weeks.map(week => {
      const firstReal = week.find(d => d);
      if(!firstReal) return '<span></span>';
      const d = new Date(firstReal.date + 'T00:00:00');
      const day = d.getDate();
      const month = d.getMonth();
      if(day <= 7 && month !== lastMonth){
        lastMonth = month;
        return '<span>' + MONTH_NAMES[month] + '</span>';
      }
      return '<span></span>';
    }).join('');

    const gridHtml = weeks.map(week => {
      const cells = week.map(d => {
        if(!d) return '<div class="heatmap-cell" style="background:#1a130a"></div>';
        const lvl = levelFromCount(d.count || 0, maxCount);
        const title = d.date + ': ' + (d.count || 0) + ' contribution' + (d.count === 1 ? '' : 's');
        return '<div class="heatmap-cell" style="background:' + AMBER_LEVELS[lvl] + '" title="' + title + '"></div>';
      }).join('');
      return '<div class="heatmap-col">' + cells + '</div>';
    }).join('');

    const rangeStart = days[0].date;
    const rangeEnd = days[days.length - 1].date;

    const legendCells = AMBER_LEVELS.map(c => '<div class="heatmap-cell" style="background:' + c + '"></div>').join('');

    const block = document.createElement('div');
    block.className = 'line heatmap-block';
    block.innerHTML =
      '<div class="heatmap-summary">' + total.toLocaleString() + ' contributions · ' + rangeStart + ' → ' + rangeEnd + '</div>' +
      '<div class="heatmap-scroll">' +
        '<div class="month-labels">' + monthLabelsHtml + '</div>' +
        '<div class="heatmap-grid">' + gridHtml + '</div>' +
      '</div>' +
      '<div class="heatmap-legend">less ' + legendCells + ' more</div>' +
      '<div class="heatmap-hint">hover a cell for the exact date and count</div>';
    termBody.appendChild(block);
  }

  function printHelp(){
    addLine(promptLine('help'));
    addLine('info:', 'out cream');
    ['whoami', 'projects', 'skills', 'contributions', 'contact'].forEach(c => addLine('  ' + c, 'out dim'));
    addLine('links:', 'out cream');
    ['github', 'linkedin', 'email'].forEach(c => addLine('  ' + c, 'out dim'));
    addLine('utility:', 'out cream');
    ['theme', 'banner', 'date', 'history', 'ls', 'clear'].forEach(c => addLine('  ' + c, 'out dim'));
    addLine('fun:', 'out cream');
    ['sudo', 'matrix', 'coffee', 'joke', 'konami'].forEach(c => addLine('  ' + c, 'out dim'));
  }

  function printWhoami(){
    addLine(promptLine('whoami'));
    addLine('Full-Stack Developer · B.Tech CSE Undergraduate, ABES Engineering College (AKTU)', 'out cream');
    addLine('Founder @ GradeWallah · IT Trainee @ BLS International · New Delhi, India', 'out');
    addLine('Open-source: GSSoC \'25 · Hacktoberfest \'25', 'out dim');
  }

  cmdInput.addEventListener('keydown', function(e){
    if(e.key !== 'Enter') return;
    const raw = cmdInput.value.trim();
    if(!raw) return;
    const cmd = raw.toLowerCase();
    cmdInput.value = '';

    addLine(promptLine(raw));
    CMD_HISTORY.push(raw);

    switch(cmd){
      case 'help': printHelp(); break;
      case 'whoami': printWhoami(); break;
      case 'projects': printProjects(); break;
      case 'skills': printSkills(); break;
      case 'contributions': printContributions(); break;
      case 'contact': printContact(); break;
      case 'github': openLink('github', 'https://github.com/Daksh12345-del', 'GitHub'); break;
      case 'linkedin': openLink('linkedin', 'https://www.linkedin.com/in/daksh-singhal-178b56282/', 'LinkedIn'); break;
      case 'email': openLink('email', 'mailto:psinghal651@gmail.com', 'email client'); break;
      case 'theme': printTheme(); break;
      case 'banner': printBanner(); break;
      case 'date': printDate(); break;
      case 'history': printHistory(); break;
      case 'ls': printLs(); break;
      case 'sudo': printSudo(); break;
      case 'matrix': printMatrix(); break;
      case 'coffee': printCoffee(); break;
      case 'joke': printJoke(); break;
      case 'konami': printKonami(); break;
      case 'clear':
        termBody.innerHTML = '';
        break;
      default:
        addLine('command not found: ' + raw + ' — try <span class="out cream">help</span>', 'out rust');
    }

    termBody.scrollTop = termBody.scrollHeight;
  });

  document.addEventListener('click', () => cmdInput.focus());
})();
