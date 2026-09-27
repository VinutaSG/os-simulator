// Clock and Navigation
setInterval(() => {
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.innerText = new Date().toLocaleTimeString();
}, 1000);

const themeBtn = document.getElementById('theme-btn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'light') {
      body.removeAttribute('data-theme');
      themeBtn.innerText = '🌙 Dark Mode';
    } else {
      body.setAttribute('data-theme', 'light');
      themeBtn.innerText = '☀️ Light Mode';
    }
  });
}

function switchModule(modName) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetModule = document.getElementById(`module-${modName}`);
  if (targetModule) targetModule.classList.add('active');
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

const cpuAlgoSelect = document.getElementById('cpu-algo');
if (cpuAlgoSelect) {
  cpuAlgoSelect.addEventListener('change', (e) => {
    const quantumGroup = document.getElementById('quantum-group');
    if (quantumGroup) quantumGroup.style.display = e.target.value === 'rr' ? 'flex' : 'none';
  });
}

// Process Scheduling Module
let processCount = 2;
function addCpuProcess() {
  processCount++;
  const tbody = document.querySelector('#cpu-table tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>P${processCount}</td>
    <td><input type="number" value="0" class="arrival-time"></td>
    <td><input type="number" value="4" class="burst-time"></td>
    <td><input type="number" value="1" class="priority-val"></td>
    <td><button class="btn-danger" onclick="removeRow(this)">Remove</button></td>
  `;
  tbody.appendChild(tr);
}

function removeRow(btn) {
  btn.closest('tr').remove();
}

function runCpuScheduling() {
  const algo = document.getElementById('cpu-algo').value;
  const quantum = parseInt(document.getElementById('cpu-quantum').value) || 2;
  const rows = document.querySelectorAll('#cpu-table tbody tr');
  
  let rawProcesses = [];
  rows.forEach((row, i) => {
    rawProcesses.push({
      id: row.cells[0].innerText,
      arrival: parseInt(row.querySelector('.arrival-time').value) || 0,
      burst: parseInt(row.querySelector('.burst-time').value) || 1,
      priority: parseInt(row.querySelector('.priority-val').value) || 0
    });
  });

  let schedule = [];
  let completionTimes = {};
  let totalProcesses = rawProcesses.length;

  if (algo === 'fcfs') {
    let proc = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);
    let curr = 0;
    proc.forEach(p => {
      if (curr < p.arrival) {
        schedule.push({ id: 'Idle', start: curr, duration: p.arrival - curr });
        curr = p.arrival;
      }
      schedule.push({ id: p.id, start: curr, duration: p.burst });
      curr += p.burst;
      completionTimes[p.id] = curr;
    });
  } 
  else if (algo === 'sjf') { // Non-preemptive SJF
    let uncompleted = rawProcesses.map(p => ({ ...p }));
    let curr = 0;
    let completedCount = 0;

    while (completedCount < totalProcesses) {
      let available = uncompleted.filter(p => p.arrival <= curr && !p.done);
      if (available.length === 0) {
        let nextArrival = Math.min(...uncompleted.filter(p => !p.done).map(p => p.arrival));
        schedule.push({ id: 'Idle', start: curr, duration: nextArrival - curr });
        curr = nextArrival;
        continue;
      }
      available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
      let p = available[0];
      schedule.push({ id: p.id, start: curr, duration: p.burst });
      curr += p.burst;
      completionTimes[p.id] = curr;
      p.done = true;
      completedCount++;
    }
  } 
  else if (algo === 'priority') { // Non-preemptive Priority (Lower number = Higher Priority)
    let uncompleted = rawProcesses.map(p => ({ ...p }));
    let curr = 0;
    let completedCount = 0;

    while (completedCount < totalProcesses) {
      let available = uncompleted.filter(p => p.arrival <= curr && !p.done);
      if (available.length === 0) {
        let nextArrival = Math.min(...uncompleted.filter(p => !p.done).map(p => p.arrival));
        schedule.push({ id: 'Idle', start: curr, duration: nextArrival - curr });
        curr = nextArrival;
        continue;
      }
      available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      let p = available[0];
      schedule.push({ id: p.id, start: curr, duration: p.burst });
      curr += p.burst;
      completionTimes[p.id] = curr;
      p.done = true;
      completedCount++;
    }
  } 
  else if (algo === 'rr') { // Round Robin
    let queue = [];
    let procMap = {};
    rawProcesses.forEach(p => {
      procMap[p.id] = { ...p, remBurst: p.burst, inQueue: false };
    });

    let curr = 0;
    let completedCount = 0;
    let sortedArrivals = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);

    // Add first arrived processes
    let addArrivals = () => {
      sortedArrivals.forEach(p => {
        if (p.arrival <= curr && !procMap[p.id].inQueue && procMap[p.id].remBurst > 0) {
          queue.push(p.id);
          procMap[p.id].inQueue = true;
        }
      });
    };

    addArrivals();

    while (completedCount < totalProcesses) {
      if (queue.length === 0) {
        let remaining = Object.values(procMap).filter(p => p.remBurst > 0);
        if (remaining.length > 0) {
          let nextArr = Math.min(...remaining.map(p => p.arrival));
          schedule.push({ id: 'Idle', start: curr, duration: nextArr - curr });
          curr = nextArr;
          addArrivals();
        }
        continue;
      }

      let pid = queue.shift();
      let p = procMap[pid];
      let execTime = Math.min(p.remBurst, quantum);

      schedule.push({ id: p.id, start: curr, duration: execTime });
      curr += execTime;
      p.remBurst -= execTime;

      addArrivals();

      if (p.remBurst > 0) {
        queue.push(p.id);
      } else {
        completionTimes[p.id] = curr;
        completedCount++;
      }
    }
  }

  // Calculate Metrics
  let totalWT = 0;
  let totalTAT = 0;

  rawProcesses.forEach(p => {
    let tat = completionTimes[p.id] - p.arrival;
    let wt = tat - p.burst;
    totalTAT += tat;
    totalWT += wt;
  });

  let avgWT = (totalWT / totalProcesses).toFixed(2);
  let avgTAT = (totalTAT / totalProcesses).toFixed(2);

  // Render Gantt Chart
  const chart = document.getElementById('gantt-chart');
  chart.innerHTML = '';
  const colorPalette = {
    'Idle': '#64748b',
    'P1': '#38bdf8',
    'P2': '#818cf8',
    'P3': '#c084fc',
    'P4': '#f472b6',
    'P5': '#34d399',
    'P6': '#fbbf24'
  };

  schedule.forEach((block) => {
    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.width = `${Math.max(block.duration * 30, 45)}px`;
    div.style.backgroundColor = colorPalette[block.id] || '#0284c7';
    div.innerText = `${block.id} (${block.start}-${block.start + block.duration})`;
    chart.appendChild(div);
  });

  document.getElementById('cpu-metrics').innerHTML = `
    <div class="metric-box"><div>Avg Waiting Time</div><div>${avgWT} ms</div></div>
    <div class="metric-box"><div>Avg Turnaround Time</div><div>${avgTAT} ms</div></div>
    <div class="metric-box"><div>Total Time</div><div>${schedule.length ? schedule[schedule.length-1].start + schedule[schedule.length-1].duration : 0} ms</div></div>
  `;
  document.getElementById('cpu-results').style.display = 'block';
}

// Memory Allocation Module
let memoryBlocks = [];
function runMemoryAllocation() {
  const total = parseInt(document.getElementById('mem-total-size').value) || 1000;
  memoryBlocks = [{ id: 'Free', size: total, allocated: false }];
  renderMemoryMap();
}

function requestMemory() {
  const size = parseInt(document.getElementById('mem-req-size').value);
  if (!size || memoryBlocks.length === 0) return;

  const strategy = document.getElementById('mem-strategy').value;
  let blockIndex = -1;

  if (strategy === 'first') {
    blockIndex = memoryBlocks.findIndex(b => !b.allocated && b.size >= size);
  } else if (strategy === 'best') {
    let bestSize = Infinity;
    memoryBlocks.forEach((b, idx) => {
      if (!b.allocated && b.size >= size && b.size < bestSize) {
        bestSize = b.size;
        blockIndex = idx;
      }
    });
  } else if (strategy === 'worst') {
    let worstSize = -1;
    memoryBlocks.forEach((b, idx) => {
      if (!b.allocated && b.size >= size && b.size > worstSize) {
        worstSize = b.size;
        blockIndex = idx;
      }
    });
  }

  if (blockIndex !== -1) {
    const block = memoryBlocks[blockIndex];
    const leftover = block.size - size;
    memoryBlocks[blockIndex] = { id: `P-${Math.floor(Math.random()*100)}`, size: size, allocated: true };
    if (leftover > 0) {
      memoryBlocks.splice(blockIndex + 1, 0, { id: 'Free', size: leftover, allocated: false });
    }
  } else {
    alert('Allocation Failed: Insufficient contiguous memory!');
  }

  renderMemoryMap();
}

function renderMemoryMap() {
  const map = document.getElementById('memory-map');
  if (!map) return;
  map.innerHTML = '';
  const total = parseInt(document.getElementById('mem-total-size').value) || 1000;

  memoryBlocks.forEach(b => {
    const div = document.createElement('div');
    div.className = 'mem-block';
    div.style.width = `${(b.size / total) * 100}%`;
    div.style.background = b.allocated ? '#ef4444' : '#22c55e';
    div.innerText = `${b.id} (${b.size}MB)`;
    map.appendChild(div);
  });
}

// Disk Scheduling Module
function runDiskScheduling() {
  const head = parseInt(document.getElementById('disk-head').value) || 0;
  const queue = document.getElementById('disk-queue').value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  
  let sequence = [head, ...queue];
  let totalSeek = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    totalSeek += Math.abs(sequence[i+1] - sequence[i]);
  }

  const seqContainer = document.getElementById('disk-sequence');
  if (seqContainer) {
    seqContainer.innerHTML = sequence.map(val => `<span class="seq-node">${val}</span>`).join(' ➔ ');
  }

  const diskMetrics = document.getElementById('disk-metrics');
  if (diskMetrics) {
    diskMetrics.innerHTML = `
      <div class="metric-box"><div>Total Head Movements</div><div>${totalSeek} Cylinders</div></div>
    `;
  }
  document.getElementById('disk-results').style.display = 'block';
}

// Page Replacement Module
function runPageReplacement() {
  const framesCount = parseInt(document.getElementById('page-frames').value) || 3;
  const pages = document.getElementById('page-ref-string').value.split(',').map(s => s.trim());
  
  let frames = [];
  let pageFaults = 0;
  let matrix = [];

  pages.forEach(page => {
    let fault = false;
    if (!frames.includes(page)) {
      pageFaults++;
      fault = true;
      if (frames.length < framesCount) {
        frames.push(page);
      } else {
        frames.shift(); // FIFO replacement
        frames.push(page);
      }
    }
    matrix.push({ page, state: [...frames], fault });
  });

  const table = document.getElementById('page-matrix');
  if (table) {
    table.innerHTML = `<tr><th>Ref</th>${pages.map(p => `<th>${p}</th>`).join('')}</tr>`;
    
    for (let f = 0; f < framesCount; f++) {
      let row = `<tr><td>Frame ${f+1}</td>`;
      matrix.forEach(step => {
        row += `<td>${step.state[f] || '-'}</td>`;
      });
      row += '</tr>';
      table.innerHTML += row;
    }
  }

  const pageMetrics = document.getElementById('page-metrics');
  if (pageMetrics) {
    pageMetrics.innerHTML = `
      <div class="metric-box"><div>Total Page Faults</div><div>${pageFaults}</div></div>
      <div class="metric-box"><div>Hit Ratio</div><div>${(((pages.length - pageFaults) / pages.length) * 100).toFixed(1)}%</div></div>
    `;
  }
  document.getElementById('page-results').style.display = 'block';
}

// Synchronization Module
let buffer = [];
const BUFFER_CAPACITY = 5;

function updateSyncUI() {
  const container = document.getElementById('buffer-container');
  if (!container) return;
  container.innerHTML = '';
  
  for (let i = 0; i < BUFFER_CAPACITY; i++) {
    const slot = document.createElement('div');
    slot.className = `buffer-slot ${buffer[i] ? 'filled' : ''}`;
    slot.innerText = buffer[i] || '';
    container.appendChild(slot);
  }

  document.getElementById('sem-mutex').innerText = '1';
  document.getElementById('sem-empty').innerText = BUFFER_CAPACITY - buffer.length;
  document.getElementById('sem-full').innerText = buffer.length;
}

function produceItem() {
  if (buffer.length < BUFFER_CAPACITY) {
    buffer.push('📦');
    updateSyncUI();
  } else {
    alert('Buffer Full! Producer is waiting.');
  }
}

function consumeItem() {
  if (buffer.length > 0) {
    buffer.pop();
    updateSyncUI();
  } else {
    alert('Buffer Empty! Consumer is waiting.');
  }
}

// Initializations
runMemoryAllocation();
updateSyncUI();
