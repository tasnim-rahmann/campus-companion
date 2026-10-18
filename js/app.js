(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const STORAGE_KEY = "campusCompanion.v1";
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const uid = () =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const initialState = () => ({
    profile: { name: "Alex Morgan", university: "" },
    dark: false,
    tasks: [
      {
        id: "t1",
        title: "Finish HTML assignment",
        subject: "Web Application",
        due: addDays(1),
        priority: "high",
        type: "Assignment",
        completed: false,
      },
      {
        id: "t2",
        title: "Revise object-oriented concepts",
        subject: "Java OOP",
        due: addDays(2),
        priority: "medium",
        type: "Study",
        completed: false,
      },
      {
        id: "t3",
        title: "Prepare database lab report",
        subject: "Database Systems",
        due: addDays(4),
        priority: "high",
        type: "Assignment",
        completed: false,
      },
      {
        id: "t4",
        title: "Practice JavaScript functions",
        subject: "Web Application",
        due: todayISO(),
        priority: "low",
        type: "Study",
        completed: true,
      },
      {
        id: "t5",
        title: "Review circuit analysis notes",
        subject: "Electrical Circuits",
        due: addDays(6),
        priority: "medium",
        type: "Study",
        completed: false,
      },
    ],
    courses: [
      { id: "c1", name: "Web Application", credits: 3, grade: 3.7 },
      { id: "c2", name: "Object-Oriented Programming", credits: 3, grade: 3.3 },
      { id: "c3", name: "Database Systems", credits: 1.5, grade: 3.7 },
    ],
    sessions: [
      {
        id: "s1",
        title: "Revise Java OOP concepts",
        subject: "Programming",
        duration: 45,
        date: todayISO(),
        time: "18:00",
        completed: false,
      },
      {
        id: "s2",
        title: "Practice HTML & CSS",
        subject: "Web Application",
        duration: 25,
        date: todayISO(),
        time: "19:00",
        completed: false,
      },
      {
        id: "s3",
        title: "Read database notes",
        subject: "Database Systems",
        duration: 45,
        date: addDays(1),
        time: "17:30",
        completed: false,
      },
    ],
  });
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state =
      saved &&
      Array.isArray(saved.tasks) &&
      Array.isArray(saved.courses) &&
      Array.isArray(saved.sessions)
        ? { ...initialState(), ...saved }
        : initialState();
  } catch {
    state = initialState();
  }
  let activeFilter = "all";
  let timerInterval = null;
  let timerDuration = 25 * 60;
  let timerRemaining = timerDuration;
  let timerRunning = false;
  const quotes = [
    "You don't have to see the whole staircase, just take the first step.",
    "Progress is progress, no matter how small.",
    "You are allowed to learn one thing at a time.",
    "A focused 20 minutes can change your whole day.",
    "Be proud of how far you've come, and keep going.",
  ];
  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast("Could not save data in this browser.", true);
    }
  };
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const fmtDate = (iso, options = { day: "numeric", month: "short" }) => {
    if (!iso) return "No date";
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime())
      ? "No date"
      : d.toLocaleDateString("en-US", options);
  };
  const daysUntil = (iso) => {
    if (!iso) return 9999;
    const target = new Date(`${iso}T00:00:00`);
    const today = new Date(`${todayISO()}T00:00:00`);
    return Math.round((target - today) / 86400000);
  };
  const toast = (message, error = false) => {
    const el = document.createElement("div");
    el.className = `toast${error ? " error" : ""}`;
    el.textContent = message;
    $("#toastRegion").append(el);
    setTimeout(() => el.remove(), 2800);
  };
  const initials = (name) =>
    (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0])
        .join("") || "S"
    ).toUpperCase();
  const weightedGPA = () => {
    const courses = state.courses.filter(
      (c) =>
        Number(c.credits) > 0 && Number(c.grade) >= 0 && Number(c.grade) <= 4,
    );
    const credits = courses.reduce((sum, c) => sum + Number(c.credits), 0);
    const points = courses.reduce(
      (sum, c) => sum + Number(c.credits) * Number(c.grade),
      0,
    );
    return { gpa: credits ? points / credits : 0, credits };
  };
  const readiness = () => {
    if (!state.tasks.length) return 0;
    const done = state.tasks.filter((t) => t.completed).length;
    const pending = state.tasks.filter((t) => !t.completed);
    const overdue = pending.filter((t) => daysUntil(t.due) < 0).length;
    return Math.max(
      0,
      Math.round((done / state.tasks.length) * 100 - overdue * 10),
    );
  };
  const renderProfile = () => {
    const name = state.profile.name || "Student";
    $("#sidebarName").textContent = name;
    $("#avatarInitials").textContent = initials(name);
    $("#topAvatar").textContent = initials(name);
    $("#settingsAvatar").textContent = initials(name);
    $("#welcomeTitle").innerHTML =
      `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${escapeHTML(name.split(" ")[0])} <span class="wave">✦</span>`;
    $("#displayName").value = name;
    $("#universityName").value = state.profile.university || "";
    $("#settingsTheme").setAttribute("aria-checked", String(!!state.dark));
    document.body.classList.toggle("dark", !!state.dark);
    $("#themeToggle").textContent = state.dark ? "☀" : "☾";
  };
  const renderDate = () => {
    const now = new Date();
    $("#topDate").textContent = now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    $("#studyDateLabel").textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };
  const renderDashboard = () => {
    const total = state.tasks.length,
      done = state.tasks.filter((t) => t.completed).length;
    const pending = state.tasks.filter((t) => !t.completed);
    const rate = total ? Math.round((done / total) * 100) : 0;
    const upcoming = pending.filter(
      (t) => daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7,
    );
    const score = readiness();
    $("#statCompleted").innerHTML =
      `${done}<span class="stat-denom"> / ${total}</span>`;
    $("#statDeadlines").textContent = upcoming.length;
    const { gpa, credits } = weightedGPA();
    $("#statGpa").textContent = credits ? gpa.toFixed(2) : "—";
    $("#statReadiness").textContent = `${score}%`;
    $("#ringLabel").textContent = `${score}%`;
    $("#readinessRing").style.background =
      `conic-gradient(var(--primary) ${score * 3.6}deg, #eeeafc ${score * 3.6}deg)`;
    $("#readinessCaption").textContent =
      score >= 80
        ? "You're in a great rhythm"
        : score >= 50
          ? "You're making steady progress"
          : "Every task is a fresh start";
    $("#heroHeadline").textContent =
      score >= 80
        ? "You're building great momentum."
        : score >= 50
          ? "You're making progress. Keep going."
          : "One small step can change your day.";
    $("#heroDescription").textContent = upcoming.length
      ? `You have ${upcoming.length} deadline${upcoming.length === 1 ? "" : "s"} coming up in the next 7 days. Let's make a plan.`
      : "Your next small step is what matters. Make today count.";
    $("#statCompletionText").textContent = total
      ? `${rate}% of your tasks are done`
      : "Add a task to get started";
    $("#progressPercent").textContent = `${rate}%`;
    $("#progressBar").style.width = `${rate}%`;
    $("#progressCompleted").textContent = `${done} completed`;
    $("#progressRemaining").textContent = `${total - done} remaining`;
    $("#navTaskCount").textContent = pending.length;
    const todayTasks = [...state.tasks]
      .filter((t) => !t.completed)
      .sort((a, b) => daysUntil(a.due) - daysUntil(b.due))
      .slice(0, 4);
    $("#todayTaskList").innerHTML = todayTasks.length
      ? todayTasks
          .map(
            (t) =>
              `<div class="today-task"><input class="task-check" type="checkbox" data-toggle-task="${t.id}" aria-label="Complete ${escapeHTML(t.title)}"><div class="today-task-copy"><strong>${escapeHTML(t.title)}</strong><span>${escapeHTML(t.subject || t.type)} · ${daysUntil(t.due) < 0 ? "Overdue" : daysUntil(t.due) === 0 ? "Due today" : `Due ${fmtDate(t.due)}`}</span></div><span class="task-tag ${t.priority}">${escapeHTML(t.priority)}</span></div>`,
          )
          .join("")
      : `<div class="empty-state"><div class="empty-icon">✓</div><strong>Nothing on your list</strong>Enjoy the breathing room or add a new task.</div>`;
    const next = [...pending]
      .sort((a, b) => daysUntil(a.due) - daysUntil(b.due))
      .slice(0, 4);
    $("#upcomingList").innerHTML = next.length
      ? next
          .map((t) => {
            const d = daysUntil(t.due);
            return `<div class="upcoming-item"><div class="date-tile"><strong>${fmtDate(t.due, { day: "numeric" })}</strong><span>${fmtDate(t.due, { month: "short" }).toUpperCase()}</span></div><div class="upcoming-copy"><strong>${escapeHTML(t.title)}</strong><span>${escapeHTML(t.subject || t.type)}</span></div><span class="days-left">${d < 0 ? `${Math.abs(d)}d late` : d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days`}</span></div>`;
          })
          .join("")
      : `<div class="empty-state"><div class="empty-icon">✦</div><strong>All caught up</strong>No pending deadlines.</div>`;
  };
  const renderTasks = () => {
    const pending = state.tasks.filter((t) => !t.completed).length;
    $("#taskTotal").textContent = state.tasks.length;
    $("#taskPending").textContent = pending;
    $("#taskDone").textContent = state.tasks.length - pending;
    $("#navTaskCount").textContent = pending;
    const query = $("#taskSearch").value.trim().toLowerCase();
    let tasks = state.tasks.filter(
      (t) =>
        (activeFilter === "all" ||
          (activeFilter === "pending" ? !t.completed : t.completed)) &&
        `${t.title} ${t.subject} ${t.type}`.toLowerCase().includes(query),
    );
    tasks.sort(
      (a, b) =>
        Number(a.completed) - Number(b.completed) ||
        daysUntil(a.due) - daysUntil(b.due),
    );
    $("#allTaskList").innerHTML = tasks.length
      ? tasks
          .map(
            (t) =>
              `<div class="all-task-row ${t.completed ? "task-complete" : ""}"><input class="task-check" type="checkbox" data-toggle-task="${t.id}" ${t.completed ? "checked" : ""} aria-label="Mark task complete"><div class="all-task-main"><span class="all-task-title">${escapeHTML(t.title)}</span><div class="all-task-meta"><span>${escapeHTML(t.subject || t.type)}</span><span>·</span><span>${daysUntil(t.due) < 0 && !t.completed ? "Overdue · " : ""}Due ${fmtDate(t.due, { day: "numeric", month: "short", year: "numeric" })}</span><span class="task-tag ${t.priority}">${escapeHTML(t.priority)} priority</span><span class="task-tag">${escapeHTML(t.type)}</span></div></div><div class="task-row-actions"><button class="row-action" data-edit-task="${t.id}" title="Edit task" aria-label="Edit task">✎</button><button class="row-action" data-delete-task="${t.id}" title="Delete task" aria-label="Delete task">×</button></div></div>`,
          )
          .join("")
      : `<div class="empty-state"><div class="empty-icon">☷</div><strong>No tasks found</strong>Try a different filter or create a new task.</div>`;
  };
  const renderCourses = () => {
    $("#courseCount").textContent =
      `${state.courses.length} course${state.courses.length === 1 ? "" : "s"}`;
    $("#courseRows").innerHTML = state.courses
      .map(
        (c) =>
          `<tr data-course-row="${c.id}"><td><input type="text" maxlength="70" value="${escapeHTML(c.name)}" data-course-field="name" aria-label="Course name"></td><td><input type="number" min="0.5" max="30" step="0.5" value="${Number(c.credits)}" data-course-field="credits" aria-label="Course credits"></td><td><select data-course-field="grade" aria-label="Grade point">${[4, 3.7, 3.3, 3, 2.7, 2.3, 2, 1.7, 1.3, 1, 0].map((g) => `<option value="${g}" ${Number(c.grade) === g ? "selected" : ""}>${g.toFixed(1)}</option>`).join("")}</select></td><td><button class="delete-course" data-delete-course="${c.id}" aria-label="Remove course">×</button></td></tr>`,
      )
      .join("");
    const { gpa, credits } = weightedGPA();
    $("#gpaBig").textContent = gpa.toFixed(2);
    $("#totalCredits").textContent = credits.toFixed(1).replace(/\.0$/, "");
    $("#totalCourses").textContent = state.courses.length;
    $("#statGpa").textContent = credits ? gpa.toFixed(2) : "—";
    $("#gpaStatus").textContent = !credits
      ? "Add a course to begin"
      : gpa >= 3.7
        ? "Excellent work — keep it up"
        : gpa >= 3.0
          ? "Good progress this semester"
          : gpa >= 2
            ? "Keep working toward your goal"
            : "Every semester is a new opportunity";
  };
  const renderSessions = () => {
    const sessions = [...state.sessions].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
    $("#sessionList").innerHTML = sessions.length
      ? sessions
          .map(
            (s) =>
              `<div class="session-item ${s.completed ? "session-finished" : ""}"><button class="task-check" data-toggle-session="${s.id}" aria-label="Mark session complete" ${s.completed ? "checked" : ""}></button><div class="session-symbol">◷</div><div class="session-copy"><strong>${escapeHTML(s.title)}</strong><span>${escapeHTML(s.subject || "Study")} · ${fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })} at ${escapeHTML(s.time)}</span></div><span class="session-duration">${s.duration}m</span><button class="row-action" data-delete-session="${s.id}" aria-label="Delete session">×</button></div>`,
          )
          .join("")
      : `<div class="empty-state"><div class="empty-icon">◷</div><strong>No study sessions yet</strong>Make a little time for your next learning goal.</div>`;
    $("#sessionTotal").textContent = state.sessions.length;
    $("#sessionCompleted").textContent = state.sessions.filter(
      (s) => s.completed,
    ).length;
    $("#studyMinutes").textContent =
      `${state.sessions.reduce((sum, s) => sum + Number(s.duration), 0)} min`;
    $("#focusStreak").textContent = state.sessions.some((s) => s.completed)
      ? "You're showing up ✦"
      : "✦ Let's start";
  };
  const renderAll = () => {
    renderProfile();
    renderDate();
    renderDashboard();
    renderTasks();
    renderCourses();
    renderSessions();
  };
  const showPage = (page) => {
    const valid = ["dashboard", "tasks", "gpa", "planner", "settings"].includes(
      page,
    )
      ? page
      : "dashboard";
    $$(".page").forEach((p) =>
      p.classList.toggle("active", p.id === `page-${valid}`),
    );
    $$(".nav-item[data-page]").forEach((b) =>
      b.classList.toggle("active", b.dataset.page === valid),
    );
    $("#pageCrumb").textContent = {
      dashboard: "Dashboard",
      tasks: "Assignments",
      gpa: "GPA calculator",
      planner: "Study planner",
      settings: "Settings",
    }[valid];
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (valid === "tasks") renderTasks();
    if (valid === "gpa") renderCourses();
    if (valid === "planner") renderSessions();
  };
  const openModal = (id) => {
    const modal = $(`#${id}`);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    const input = modal.querySelector("input:not([type=hidden])");
    if (input) setTimeout(() => input.focus(), 50);
  };
  const closeModal = (id) => {
    const modal = $(`#${id}`);
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  };
  const openTaskModal = (task) => {
    $("#taskForm").reset();
    $("#taskId").value = task?.id || "";
    $("#taskTitle").value = task?.title || "";
    $("#taskSubject").value = task?.subject || "";
    $("#taskDue").value = task?.due || todayISO();
    $("#taskPriority").value = task?.priority || "medium";
    $("#taskType").value = task?.type || "Assignment";
    $("#taskModalTitle").textContent = task ? "Edit task" : "Create a task";
    openModal("taskModal");
  };
  const toggleTask = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    renderAll();
    toast(
      t.completed
        ? "Task completed — nice work!"
        : "Task moved back to in progress.",
    );
  };
  const deleteTask = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    if (!confirm(`Delete "${t.title}"?`)) return;
    state.tasks = state.tasks.filter((x) => x.id !== id);
    save();
    renderAll();
    toast("Task deleted.");
  };
  const toggleTheme = () => {
    state.dark = !state.dark;
    save();
    renderProfile();
    toast(state.dark ? "Dark mode enabled." : "Light mode enabled.");
  };
  const addCourse = () => {
    state.courses.push({ id: uid(), name: "New course", credits: 3, grade: 3 });
    save();
    renderCourses();
    const rows = $$("#courseRows tr");
    const input = rows[rows.length - 1]?.querySelector(
      '[data-course-field="name"]',
    );
    if (input) {
      input.focus();
      input.select();
    }
  };
  const setTimerMinutes = (minutes) => {
    pauseTimer();
    timerDuration = minutes * 60;
    timerRemaining = timerDuration;
    $("#timerNote").textContent = "";
    $$(".preset").forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.minutes) === minutes),
    );
    updateTimerUI();
  };
  const updateTimerUI = () => {
    const m = Math.floor(timerRemaining / 60),
      s = timerRemaining % 60;
    $("#timerDisplay").textContent =
      `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const progress = $("#timerProgress");
    progress.style.strokeDashoffset = String(
      603.2 * (1 - timerRemaining / timerDuration),
    );
    $("#timerStart").textContent = timerRunning ? "Pause focus" : "Start focus";
    $("#timerStatus").textContent = timerRunning
      ? "YOU'RE IN THE ZONE"
      : "READY WHEN YOU ARE";
  };
  const pauseTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
  };
  const startTimer = () => {
    if (timerRunning) {
      pauseTimer();
      updateTimerUI();
      return;
    }
    if (timerRemaining <= 0) timerRemaining = timerDuration;
    timerRunning = true;
    updateTimerUI();
    timerInterval = setInterval(() => {
      timerRemaining--;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        pauseTimer();
        updateTimerUI();
        $("#timerNote").textContent =
          "Session complete! Take a breath and celebrate.";
        toast("Focus session complete! Great work.");
        return;
      }
      updateTimerUI();
    }, 1000);
  };

  document.addEventListener("click", (e) => {
    const pageBtn = e.target.closest("[data-page]");
    if (pageBtn) {
      e.preventDefault();
      showPage(pageBtn.dataset.page);
      return;
    }
    const close = e.target.closest("[data-close-modal]");
    if (close) {
      closeModal(close.dataset.closeModal);
      return;
    }
    const toggle = e.target.closest("[data-toggle-task]");
    if (toggle) {
      toggleTask(toggle.dataset.toggleTask);
      return;
    }
    const edit = e.target.closest("[data-edit-task]");
    if (edit) {
      openTaskModal(state.tasks.find((t) => t.id === edit.dataset.editTask));
      return;
    }
    const del = e.target.closest("[data-delete-task]");
    if (del) {
      deleteTask(del.dataset.deleteTask);
      return;
    }
    const delCourse = e.target.closest("[data-delete-course]");
    if (delCourse) {
      state.courses = state.courses.filter(
        (c) => c.id !== delCourse.dataset.deleteCourse,
      );
      save();
      renderCourses();
      renderDashboard();
      toast("Course removed.");
      return;
    }
    const toggleSession = e.target.closest("[data-toggle-session]");
    if (toggleSession) {
      const s = state.sessions.find(
        (x) => x.id === toggleSession.dataset.toggleSession,
      );
      if (s) {
        s.completed = !s.completed;
        save();
        renderSessions();
        toast(
          s.completed
            ? "Study session completed!"
            : "Session marked incomplete.",
        );
      }
      return;
    }
    const delSession = e.target.closest("[data-delete-session]");
    if (delSession) {
      state.sessions = state.sessions.filter(
        (s) => s.id !== delSession.dataset.deleteSession,
      );
      save();
      renderSessions();
      toast("Study session removed.");
      return;
    }
    const filter = e.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      $$(".filter-button").forEach((b) =>
        b.classList.toggle("active", b === filter),
      );
      renderTasks();
      return;
    }
    const preset = e.target.closest("[data-minutes]");
    if (preset) {
      setTimerMinutes(Number(preset.dataset.minutes));
      return;
    }
    if (
      e.target.closest("#quickAddTask") ||
      e.target.closest("#addTaskButton")
    ) {
      openTaskModal();
      return;
    }
  });
  $("#taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("#taskId").value;
    const task = {
      id: id || uid(),
      title: $("#taskTitle").value.trim(),
      subject: $("#taskSubject").value.trim(),
      due: $("#taskDue").value,
      priority: $("#taskPriority").value,
      type: $("#taskType").value,
      completed: false,
    };
    if (!task.title || !task.due) {
      toast("Please add a title and due date.", true);
      return;
    }
    if (id) {
      const old = state.tasks.find((t) => t.id === id);
      task.completed = old?.completed || false;
      state.tasks = state.tasks.map((t) => (t.id === id ? task : t));
      toast("Task updated.");
    } else {
      state.tasks.push(task);
      toast("Task added to your workspace.");
    }
    save();
    renderAll();
    closeModal("taskModal");
  });
  $("#taskSearch").addEventListener("input", renderTasks);
  $("#addCourse").addEventListener("click", addCourse);
  $("#courseRows").addEventListener("change", (e) => {
    const field = e.target.dataset.courseField;
    if (!field) return;
    const row = e.target.closest("[data-course-row]");
    const course = state.courses.find((c) => c.id === row.dataset.courseRow);
    if (!course) return;
    if (field === "name") course.name = e.target.value.trim().slice(0, 70);
    if (field === "credits") {
      const n = Number(e.target.value);
      if (!Number.isFinite(n) || n < 0.5 || n > 30) {
        e.target.value = course.credits;
        toast("Credits must be between 0.5 and 30.", true);
        return;
      }
      course.credits = n;
    }
    if (field === "grade") {
      const n = Number(e.target.value);
      if (n < 0 || n > 4) {
        toast("Grade point must be between 0 and 4.", true);
        return;
      }
      course.grade = n;
    }
    save();
    renderCourses();
    renderDashboard();
    toast("GPA updated.");
  });
  $("#clearCourses").addEventListener("click", () => {
    if (!confirm("Remove all courses from the GPA calculator?")) return;
    state.courses = [];
    save();
    renderCourses();
    renderDashboard();
    toast("Courses cleared.");
  });
  $("#addSessionButton").addEventListener("click", () => {
    $("#sessionForm").reset();
    $("#sessionDate").value = todayISO();
    $("#sessionTime").value = "18:00";
    openModal("sessionModal");
  });
  $("#sessionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const session = {
      id: uid(),
      title: $("#sessionTitle").value.trim(),
      subject: $("#sessionSubject").value.trim(),
      duration: Number($("#sessionDuration").value),
      date: $("#sessionDate").value,
      time: $("#sessionTime").value,
      completed: false,
    };
    if (!session.title || !session.date || !session.time) {
      toast("Please complete the session details.", true);
      return;
    }
    state.sessions.push(session);
    save();
    renderSessions();
    closeModal("sessionModal");
    toast("Study session planned.");
  });
  $("#timerStart").addEventListener("click", startTimer);
  $("#timerReset").addEventListener("click", () => {
    pauseTimer();
    timerRemaining = timerDuration;
    $("#timerNote").textContent = "";
    updateTimerUI();
  });
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#settingsTheme").addEventListener("click", toggleTheme);
  $("#profileSettings").addEventListener("click", () => showPage("settings"));
  $("#topAvatar").addEventListener("click", () => showPage("settings"));
  $("#profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#displayName").value.trim();
    if (!name) {
      toast("Please enter a display name.", true);
      return;
    }
    state.profile.name = name;
    state.profile.university = $("#universityName").value.trim();
    save();
    renderProfile();
    toast("Profile saved.");
  });
  $("#resetData").addEventListener("click", () => {
    if (
      !confirm(
        "Reset all Campus Companion data? Your saved tasks, courses, sessions, and settings will be replaced with demo data.",
      )
    )
      return;
    pauseTimer();
    state = initialState();
    save();
    renderAll();
    setTimerMinutes(25);
    showPage("dashboard");
    toast("Demo data restored.");
  });
  $("#newQuote").addEventListener("click", () => {
    const current = $("#dailyQuote").textContent;
    let next;
    do {
      next = quotes[Math.floor(Math.random() * quotes.length)];
    } while (next === current && quotes.length > 1);
    $("#dailyQuote").textContent = next;
  });
  $("#menuToggle").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
      $$(".modal-backdrop.open").forEach((m) => closeModal(m.id));
  });
  $$(".modal-backdrop").forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) closeModal(m.id);
    }),
  );
  renderAll();
  updateTimerUI();
})();
