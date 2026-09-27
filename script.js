// Clock and Navigation
setInterval(() => {
  document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

document.getElementById('theme-btn').addEventListener('click', () => {
  const body = document.body;
  if (body.getAttribute('data-theme') === 'light') {
    body.removeAttribute('data-theme');
    document.getElementById('theme-btn').innerText = '🌙 Dark Mode';
  } else {
    body.setAttribute('data-theme', 'light');
    document.getElementById('theme-btn').innerText = '☀️ Light Mode';
  }
});

function switchModule(modName) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`module-${modName}`).classList.add('active');
  event.currentTarget.classList.add('active');
}

document.getElementById('cpu-algo').addEventListener('change', (e) => {
  document.getElementById('quantum-group').style.display = e.target.value === 'rr' ? 'flex' : 'none';
});

// Process Scheduling Module
let processCount = 2;
function addCpuProcess() {
  processCount++;
  const tbody = document.querySelector('#cpu-table tbody');
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
  const rows = document.querySelectorAll('#cpu-table tbody tr');
  let processes = [];

  rows.forEach((row, i) => {
    processes.push({
      id: row.cells[0].innerText,
      arrival: parseInt(row.querySelector('.arrival-time').value) || 0,
      burst: parseInt(row.querySelector('.burst-time').value) || 1,
      priority: parseInt(row.querySelector('.priority-val').value) || 0
    });
  });

  let schedule = [];
  let currentTime = 0;

  // Simple FCFS Simulation Engine Logic
  processes.sort((a, b) => a.arrival - b.arrival);
  processes.forEach(p => {
    if (currentTime < p.arrival) currentTime = p.arrival;
    schedule.push({ id: p.id, start: currentTime, duration: p.burst });
    currentTime += p.burst;
  });

  // Render Gantt Chart
  const chart = document.getElementById('gantt-chart');
  chart.innerHTML = '';
  const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399'];

  schedule.forEach((block, idx) => {
    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.width = `${block.duration * 20}px`;
    div.style.backgroundColor = colors[idx % colors.length];
    div.innerText = `${block.id} (${block.duration}s)`;
    chart.appendChild(div);
  });

  document.getElementById('cpu-metrics').innerHTML = `
    <div class="metric-box"><div>Total Execution Time</div><div>${currentTime} ms</div></div>
    <div class="metric-box"><div>Completed Processes</div><div>${processes.length}</div></div>
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
  seqContainer.innerHTML = sequence.map(val => `<span class="seq-node">${val}</span>`).join(' ➔ ');

  document.getElementById('disk-metrics').innerHTML = `
    <div class="metric-box"><div>Total Head Movements</div><div>${totalSeek} Cylinders</div></div>
  `;
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
        frames.shift(); // FIFO implementation
        frames.push(page);
      }
    }
    matrix.push({ page, state: [...frames], fault });
  });

  const table = document.getElementById('page-matrix');
  table.innerHTML = `<tr><th>Ref</th>${pages.map(p => `<th>${p}</th>`).join('')}</tr>`;
  
  for (let f = 0; f < framesCount; f++) {
    let row = `<tr><td>Frame ${f+1}</td>`;
    matrix.forEach(step => {
      row += `<td>${step.state[f] || '-'}</td>`;
    });
    row += '</tr>';
    table.innerHTML += row;
  }

  document.getElementById('page-metrics').innerHTML = `
    <div class="metric-box"><div>Total Page Faults</div><div>${pageFaults}</div></div>
    <div class="metric-box"><div>Hit Ratio</div><div>${(((pages.length - pageFaults) / pages.length) * 100).toFixed(1)}%</div></div>
  `;
  document.getElementById('page-results').style.display = 'block';
}

// Synchronization Module
let buffer = [];
const BUFFER_CAPACITY = 5;

function updateSyncUI() {
  const container = document.getElementById('buffer-container');
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

// Initialize default view
runMemoryAllocation();
updateSyncUI();