/**
 * First-Time Walkthrough Guide
 * Shows a step-by-step overlay on first login.
 * State stored in user_settings table via API.
 */
(function () {
  const STORAGE_KEY = 'finmate_walkthrough_completed';

  const steps = [
    {
      icon: 'fa-hand-wave',
      iconClass: 'icon-nav',
      title: 'Welcome to FinMate!',
      desc: 'Your personal finance management dashboard. Let us show you around — it only takes a minute.'
    },
    {
      icon: 'fa-bars-staggered',
      iconClass: 'icon-nav',
      title: 'Sidebar Navigation',
      desc: 'Use the sidebar on the left to navigate between features. You can collapse it by clicking the hamburger icon at the top. It remembers your preference.'
    },
    {
      icon: 'fa-chart-line',
      iconClass: 'icon-dash',
      title: 'Your Dashboard',
      desc: 'This is your home base. You will see an overview of your finances — recent transactions, budget status, and key stats at a glance.'
    },
    {
      icon: 'fa-money-bill-wave',
      iconClass: 'icon-expense',
      title: 'Track Expenses & Income',
      desc: 'Log expenses as you spend, record income when it comes in, and set budgets to stay on track. Everything is just a click away in the sidebar.'
    },
    {
      icon: 'fa-bell',
      iconClass: 'icon-notify',
      title: 'Notifications & Settings',
      desc: 'You will get alerts when you approach budget limits or when actions need your attention. Visit Settings to customise your experience.'
    }
  ];

  let currentStep = 0;
  let overlay = null;

  function getRole() {
    const path = window.location.pathname;
    if (path.startsWith('/super-admin')) return 'superAdmin';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/team-leader')) return 'teamLeader';
    if (path.startsWith('/team-member')) return 'teamMember';
    return 'individualUser';
  }

  function getDashboardPath() {
    const role = getRole();
    const map = {
      superAdmin: '/super-admin/dashboard',
      admin: '/admin/dashboard',
      teamLeader: '/team-leader/dashboard',
      teamMember: '/team-member/dashboard',
      individualUser: '/user/dashboard'
    };
    return map[role] || '/user/dashboard';
  }

  function render() {
    const s = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    overlay.innerHTML = `
      <div class="walkthrough-card">
        <button class="walkthrough-close" id="wt-close" title="Close guide">
          <i class="fas fa-times"></i>
        </button>
        <div class="walkthrough-step-icon ${s.iconClass}">
          <i class="fas ${s.icon}"></i>
        </div>
        <h3 class="walkthrough-title">${s.title}</h3>
        <p class="walkthrough-desc">${s.desc}</p>
        <div class="walkthrough-progress">
          ${steps.map((_, i) => `<div class="walkthrough-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}"></div>`).join('')}
        </div>
        <div class="walkthrough-actions">
          <button class="walkthrough-btn walkthrough-btn-skip" id="wt-skip">Skip all</button>
          <button class="walkthrough-btn ${isLast ? 'walkthrough-btn-done' : 'walkthrough-btn-next'}" id="wt-next">
            ${isLast ? 'Get started' : 'Next'} ${!isLast ? '<i class="fas fa-arrow-right" style="margin-left:6px;font-size:0.8rem"></i>' : ''}
          </button>
        </div>
      </div>
    `;

    document.getElementById('wt-close').onclick = close;
    document.getElementById('wt-skip').onclick = close;
    document.getElementById('wt-next').onclick = function () {
      if (isLast) {
        close();
      } else {
        currentStep++;
        render();
      }
    };
  }

  function close() {
    overlay.classList.remove('active');
    localStorage.setItem(STORAGE_KEY, '1');
    fetch('/auth/walkthrough-complete', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    setTimeout(() => { overlay.remove(); overlay = null; }, 300);
  }

  function show() {
    overlay = document.createElement('div');
    overlay.className = 'walkthrough-overlay';
    document.body.appendChild(overlay);
    render();
    requestAnimationFrame(() => overlay.classList.add('active'));
  }

  function init() {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (sessionStorage.getItem('wtChecked')) return;
    sessionStorage.setItem('wtChecked', '1');

    fetch('/auth/walkthrough-status')
      .then(r => r.json())
      .then(data => {
        if (data.completed) {
          localStorage.setItem(STORAGE_KEY, '1');
          return;
        }
        setTimeout(show, 600);
      })
      .catch(() => {
        // If API fails, show walkthrough on first visit anyway (localStorage check above handles repeat visits)
        setTimeout(show, 600);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
