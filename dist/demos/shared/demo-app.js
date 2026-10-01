import { DemoApi } from "../../src/shared/demo-api.js";

const definitions = {
  "orbit-finance": {
    title: "Orbit Finance",
    mark: "O",
    icon: "◉",
    kicker: "Personal money, in orbit",
    description:
      "A clear view of everyday spending, income, and the small budgets that keep plans on track.",
    collections: ["transactions", "budgets"],
  },
  "field-notes": {
    title: "Field Notes",
    mark: "F",
    icon: "✳",
    kicker: "Objects for thoughtful days",
    description:
      "Browse a small stationery collection, build a cart, and try a simulated checkout. No payment is taken.",
    collections: ["products", "orders"],
  },
  "common-ground": {
    title: "Common Ground",
    mark: "C",
    icon: "◷",
    kicker: "Make room for a good conversation",
    description:
      "Choose an open session, manage your bookings, and see availability update as you go.",
    collections: ["slots", "bookings"],
  },
  taskline: {
    title: "Taskline",
    mark: "T",
    icon: "↗",
    kicker: "A calmer way to move work",
    description:
      "Capture tasks, set priorities, and move the work through a simple three-step board.",
    collections: ["tasks"],
  },
  gather: {
    title: "Gather",
    mark: "G",
    icon: "✳",
    kicker: "Good things happen together",
    description:
      "Explore small community events and manage your RSVPs. Attendee totals include illustrative sample counts.",
    collections: ["events", "rsvps"],
  },
  waypoint: {
    title: "Waypoint",
    mark: "W",
    icon: "⌖",
    kicker: "Leave room for the unexpected",
    description:
      "Shape a day-by-day itinerary and move activities around as your plans take shape.",
    collections: ["activities"],
  },
  greenhouse: {
    title: "Greenhouse",
    mark: "H",
    icon: "❋",
    kicker: "A little care, right on time",
    description:
      "Keep a small plant collection thriving with a simple watering schedule and care log.",
    collections: ["plants", "waterings"],
  },
  pageturn: {
    title: "PageTurn",
    mark: "P",
    icon: "▤",
    kicker: "Keep your place, find your next",
    description:
      "Track what you are reading, update your progress, and keep a short list for later.",
    collections: ["books"],
  },
  helpdesk: {
    title: "Helpdesk",
    mark: "H",
    icon: "◎",
    kicker: "Support that stays human",
    description:
      "Triage a small ticket queue, change priorities, and close the loop on open requests.",
    collections: ["tickets"],
  },
};

const slug = document.body.dataset.demo;
const definition = definitions[slug];
const root = document.querySelector("#demo-root");
const api = new DemoApi(slug);
const data = {};
const state = { notice: "", error: "", productFilter: "All", cart: new Map() };
let fieldSequence = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function emptyState(message) {
  return `<div class="demo-empty">${escapeHtml(message)}</div>`;
}

function stat(label, value, note = "") {
  return `<div class="demo-stat"><span class="demo-stat-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note ? `<p class="demo-panel-subtitle">${escapeHtml(note)}</p>` : ""}</div>`;
}

function panel(title, content, subtitle = "") {
  return `<section class="demo-panel"><div class="demo-panel-head"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p class="demo-panel-subtitle">${escapeHtml(subtitle)}</p>` : ""}</div></div>${content}</section>`;
}

function field(label, name, type = "text", options = {}) {
  const inputId = `demo-field-${fieldSequence++}`;
  const isOptional = options.required === false || type === "time";
  const required = isOptional ? "" : "required";
  const requiredText = isOptional
    ? ""
    : `<span class="visually-hidden">, required</span>`;
  const value = options.value ?? (type === "time" ? "10:00" : undefined);
  const input =
    type === "select"
      ? `<select id="${inputId}" name="${name}" ${required}>${options.values.map((value) => `<option>${escapeHtml(value)}</option>`).join("")}</select>`
      : `<input id="${inputId}" name="${name}" type="${type}" ${type === "number" ? `min="${options.min ?? 0}" step="${options.step ?? 1}"` : ""} ${options.maxLength ? `maxlength="${options.maxLength}"` : 'maxlength="120"'} ${required} ${value !== undefined ? `value="${escapeHtml(value)}"` : ""} ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ""} />`;
  return `<div class="demo-field"><label for="${inputId}">${escapeHtml(label)}${requiredText}</label>${input}</div>`;
}

function form(id, title, fields, button = "Add") {
  return panel(
    title,
    `<form class="demo-form" data-form="${id}">${fields}<button class="demo-submit" type="submit">${escapeHtml(button)} <span aria-hidden="true">+</span></button></form>`,
  );
}

function iconButton(action, id, label, icon, extra = "") {
  return `<button class="demo-icon-button" type="button" data-action="${action}" data-id="${escapeHtml(id)}" ${extra} aria-label="${escapeHtml(label)}">${icon}</button>`;
}

function noticeMarkup() {
  if (state.error)
    return `<p class="demo-message error" role="alert">${escapeHtml(state.error)}</p>`;
  return `<p class="demo-message" role="status">${escapeHtml(state.notice)}</p>`;
}

function transactionList() {
  const transactions = [...(data.transactions || [])].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)),
  );
  if (!transactions.length)
    return emptyState("Your transactions will appear here.");
  return `<div class="demo-list">${transactions.map((item) => `<article class="demo-item"><div><p class="demo-item-title">${escapeHtml(item.title)}</p><div class="demo-item-detail"><span>${escapeHtml(item.category || "Other")}</span><span>${escapeHtml(item.date || "Today")}</span><span class="demo-badge ${item.type === "income" ? "good" : ""}">${escapeHtml(item.type || "expense")}</span></div></div><div class="demo-item-actions"><strong>${item.type === "income" ? "+" : "−"}${money(item.amount)}</strong>${iconButton("delete-transaction", item.id, `Delete ${item.title}`, "×")}</div></article>`).join("")}</div>`;
}

function orbitView() {
  const transactions = data.transactions || [];
  const budgets = data.budgets || [];
  const income = transactions
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = transactions
    .filter((entry) => entry.type !== "income")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const budgetView = budgets.length
    ? `<div class="demo-list">${budgets
        .map((budget) => {
          const ratio = Math.min(
            100,
            Math.round(
              (Number(budget.spent) / Math.max(1, Number(budget.limit))) * 100,
            ),
          );
          return `<article><div class="demo-item"><div><p class="demo-item-title">${escapeHtml(budget.title)}</p><div class="demo-item-detail"><span>${money(budget.spent)} of ${money(budget.limit)}</span></div><div class="demo-progress"><span style="width:${ratio}%"></span></div></div>${iconButton("delete-budget", budget.id, `Delete ${budget.title} budget`, "×")}</div></article>`;
        })
        .join("")}</div>`
    : emptyState("Add a budget to keep an eye on a category.");
  return `<section class="demo-stats">${stat("Available balance", money(income - expenses), "Income minus spending")}${stat("Income", money(income), "Sample month")}${stat("Spending", money(expenses), `${transactions.length} transactions`)}${stat("Budgets", budgets.length, "Categories tracked")}</section><div class="demo-layout"><div>${panel("Recent transactions", transactionList(), "Your sample and added activity")}${panel("Monthly overview", `<div class="orbit-bars"><div><span>Income</span><i style="--bar:100%"></i><strong>${money(income)}</strong></div><div><span>Spending</span><i style="--bar:${Math.min(100, Math.round((expenses / Math.max(1, income)) * 100))}%"></i><strong>${money(expenses)}</strong></div></div>`)}</div><aside>${form("transaction", "Add a transaction", `<div class="demo-form-row">${field("Description", "title", "text", { maxLength: 80 })}${field("Amount", "amount", "number", { step: "0.01", min: "0.01" })}</div><div class="demo-form-row">${field("Type", "type", "select", { values: ["expense", "income"] })}${field("Category", "category", "text", { maxLength: 40 })}</div>${field("Date", "date", "date", { required: false, value: new Date().toISOString().slice(0, 10) })}`)}${panel("Budgets", budgetView)}${form("budget", "Add a budget", `<div class="demo-form-row">${field("Category", "title", "text", { maxLength: 40 })}${field("Monthly limit", "limit", "number", { step: "0.01", min: "1" })}</div>`)}</aside></div>`;
}

function fieldNotesView() {
  const products = data.products || [];
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];
  const visibleProducts = products.filter(
    (product) =>
      state.productFilter === "All" || product.category === state.productFilter,
  );
  const cartItems = [...state.cart.entries()]
    .map(([id, quantity]) => ({
      product: products.find((product) => product.id === id),
      quantity,
    }))
    .filter((item) => item.product);
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const orders = data.orders || [];
  const catalog = `<div class="demo-filter-row">${categories.map((category) => `<button class="demo-badge ${category === state.productFilter ? "good" : ""}" type="button" data-action="filter-products" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div><div class="demo-grid">${visibleProducts.map((product, index) => `<article class="demo-product"><span class="product-glyph" aria-hidden="true">${["▤", "✎", "⌁", "▦"][index % 4]}</span><span class="demo-badge">${escapeHtml(product.category)}</span><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.detail)}</p><div class="demo-product-bottom"><strong>${money(product.price)}</strong><button class="demo-action" type="button" data-action="cart-add" data-id="${escapeHtml(product.id)}">Add to bag</button></div></article>`).join("") || emptyState("No products in this category.")}</div>`;
  const cart = cartItems.length
    ? `<div class="demo-list">${cartItems.map(({ product, quantity }) => `<article class="demo-item"><div><p class="demo-item-title">${escapeHtml(product.title)}</p><div class="demo-item-detail"><span>${quantity} × ${money(product.price)}</span></div></div><div class="demo-item-actions">${iconButton("cart-remove", product.id, `Remove one ${product.title}`, "−")}${iconButton("cart-add", product.id, `Add one ${product.title}`, "+")}</div></article>`).join("")}</div>`
    : emptyState("Your bag is ready for a good idea.");
  const orderList = orders.length
    ? `<div class="demo-list">${orders
        .slice()
        .reverse()
        .map(
          (order) =>
            `<article class="demo-item"><div><p class="demo-item-title">Sample order</p><div class="demo-item-detail"><span>${escapeHtml(order.itemCount)} items</span><span>${escapeHtml(order.date)}</span></div></div><strong>${money(order.total)}</strong></article>`,
        )
        .join("")}</div>`
    : emptyState("Completed sample orders appear here.");
  return `<section class="demo-stats">${stat("Small-batch goods", products.length, "Objects for everyday notes")}${stat(
    "In your bag",
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
    "This session",
  )}${stat("Sample orders", orders.length, "No payment is collected")}${stat("Bag total", money(total), "Illustrative prices")}</section><div class="demo-layout"><div>${panel("The collection", catalog, "Choose a few things to try the demo")}${panel("Recent sample orders", orderList)}</div><aside>${panel("Your bag", `${cart}<div class="demo-checkout"><strong>Total ${money(total)}</strong><button class="demo-submit" type="button" data-action="checkout" ${cartItems.length ? "" : "disabled"}>Place sample order</button></div><p class="demo-panel-subtitle">Demo only. No payment details are collected.</p>`)}</aside></div>`;
}

function commonGroundView() {
  const bookings = data.bookings || [];
  const bookedSlots = new Set(bookings.map((booking) => booking.slotId));
  const slots = data.slots || [];
  const available = slots.filter((slot) => !bookedSlots.has(slot.id));
  const slotCards = available.length
    ? `<div class="demo-grid">${available.map((slot) => `<article class="demo-product"><span class="demo-badge good">Open</span><h3>${escapeHtml(slot.title)}</h3><p>${escapeHtml(slot.duration)} minute planning session. This reservation is saved only in your demo.</p><button class="demo-action" type="button" data-action="book-slot" data-id="${escapeHtml(slot.id)}">Reserve this time</button></article>`).join("")}</div>`
    : emptyState(
        "All sample times are booked. Cancel a booking to reopen one.",
      );
  const bookingList = bookings.length
    ? `<div class="demo-list">${bookings.map((booking) => `<article class="demo-item"><div><p class="demo-item-title">${escapeHtml(booking.title)}</p><div class="demo-item-detail"><span>${escapeHtml(booking.date)}</span><span>${escapeHtml(booking.time)}</span><span class="demo-badge good">${escapeHtml(booking.status)}</span></div></div>${iconButton("cancel-booking", booking.id, `Cancel ${booking.title}`, "×")}</article>`).join("")}</div>`
    : emptyState("No reservations yet. Pick an open time to get started.");
  return `<section class="demo-stats">${stat("Open times", available.length, "Across the sample week")}${stat("Your bookings", bookings.length, "Saved in this browser session")}${stat("Session length", "60 min", "Focused, one-to-one time")}${stat("Next step", bookings.length ? "You're set" : "Choose a time", "No account required")}</section><div class="demo-layout"><div>${panel("Find a time", slotCards, "Choose any open slot")}</div><aside>${panel("Your bookings", bookingList)}${panel("A note on this demo", `<p class="demo-copy">This is a local scheduling prototype. It does not send invitations or collect personal details.</p>`)}</aside></div>`;
}

function tasklineView() {
  const tasks = data.tasks || [];
  const statuses = ["To do", "In progress", "Done"];
  const columns = statuses
    .map((status) => {
      const columnTasks = tasks.filter((task) => task.status === status);
      return `<section class="demo-column"><div class="demo-column-head"><span>${status}</span><span>${columnTasks.length}</span></div>${columnTasks.map((task) => `<article class="demo-ticket"><p>${escapeHtml(task.title)}</p><div class="demo-item-detail"><span class="demo-badge ${task.priority === "High" ? "warning" : ""}">${escapeHtml(task.priority)}</span><span>${escapeHtml(task.due || "No due date")}</span></div><div class="demo-inline-controls">${iconButton("task-next", task.id, `Move ${task.title} to next status`, "→")}${iconButton("task-delete", task.id, `Delete ${task.title}`, "×")}</div></article>`).join("") || `<p class="demo-panel-subtitle">Nothing here yet.</p>`}</section>`;
    })
    .join("");
  return `<section class="demo-stats">${stat("Open tasks", tasks.filter((task) => task.status !== "Done").length, "A manageable queue")}${stat("In progress", tasks.filter((task) => task.status === "In progress").length, "Keep focus narrow")}${stat("Completed", tasks.filter((task) => task.status === "Done").length, "Nice work")}${stat("High priority", tasks.filter((task) => task.priority === "High" && task.status !== "Done").length, "Still on the board")}</section><div class="demo-layout"><div>${panel("Your board", `<div class="demo-board">${columns}</div>`, "Move a task forward with the arrow")}</div><aside>${form("task", "Capture a task", `${field("Task title", "title", "text", { maxLength: 100 })}<div class="demo-form-row">${field("Priority", "priority", "select", { values: ["Low", "Medium", "High"] })}${field("Due date", "due", "date", { required: false })}</div>`)}</aside></div>`;
}

function gatherView() {
  const events = data.events || [];
  const rsvps = data.rsvps || [];
  const cards = events
    .map((event) => {
      const going = rsvps.some((rsvp) => rsvp.eventId === event.id);
      const count = Number(event.attendees || 0) + Number(going);
      return `<article class="demo-product"><span class="demo-badge">${escapeHtml(event.category)}</span><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.date)} · ${escapeHtml(event.venue)}</p><div class="demo-item-detail"><span>${count} / ${escapeHtml(event.capacity)} going</span><div class="demo-progress"><span style="width:${Math.min(100, (count / Number(event.capacity)) * 100)}%"></span></div></div><button class="demo-action ${going ? "secondary" : ""}" type="button" data-action="${going ? "cancel-rsvp" : "rsvp"}" data-id="${escapeHtml(event.id)}">${going ? "Cancel RSVP" : "I'm interested"}</button></article>`;
    })
    .join("");
  const rsvpList = rsvps.length
    ? `<div class="demo-list">${rsvps.map((rsvp) => `<article class="demo-item"><div><p class="demo-item-title">${escapeHtml(rsvp.title)}</p><div class="demo-item-detail"><span>${escapeHtml(rsvp.date)}</span><span class="demo-badge good">Going</span></div></div>${iconButton("cancel-rsvp", rsvp.eventId, `Cancel RSVP for ${rsvp.title}`, "×")}</article>`).join("")}</div>`
    : emptyState("Your event plans will show up here.");
  return `<section class="demo-stats">${stat("Events to explore", events.length, "Small community gatherings")}${stat("Your RSVPs", rsvps.length, "Manage them here")}${stat("Formats", new Set(events.map((event) => event.category)).size, "Talks, workshops, meetups")}${stat("Data", "Sample", "Attendee counts are illustrative")}</section><div class="demo-layout"><div>${panel("Coming up", `<div class="demo-grid">${cards || emptyState("No events are scheduled yet.")}</div>`)}</div><aside>${panel("Your plans", rsvpList)}${panel("Sample data", `<p class="demo-copy">Event attendance starts from illustrative sample counts. RSVPs are private to this browser session.</p>`)}</aside></div>`;
}

function waypointView() {
  const activities = data.activities || [];
  const days = ["Day 1", "Day 2", "Day 3"];
  const dayPanels = days
    .map((day) => {
      const items = activities
        .filter((activity) => activity.day === day)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)));
      return `<section class="demo-column"><div class="demo-column-head"><span>${day}</span><span>${items.length} stops</span></div>${items.map((activity) => `<article class="demo-ticket"><span class="demo-mono">${escapeHtml(activity.time)}</span><p>${escapeHtml(activity.title)}</p><div class="demo-item-detail"><span>⌖ ${escapeHtml(activity.place)}</span></div><div class="demo-inline-controls">${iconButton("activity-move", activity.id, `Move ${activity.title} to next day`, "→")}${iconButton("activity-delete", activity.id, `Delete ${activity.title}`, "×")}</div></article>`).join("") || `<p class="demo-panel-subtitle">A little space for wandering.</p>`}</section>`;
    })
    .join("");
  return `<section class="demo-stats">${stat("Planned stops", activities.length, "Across your itinerary")}${stat("Days", days.length, "Room to explore")}${stat("Saved places", new Set(activities.map((item) => item.place)).size, "Unique locations")}${stat("Pace", "Unhurried", "Leave room for detours")}</section><div class="demo-layout"><div>${panel("Your itinerary", `<div class="demo-board">${dayPanels}</div>`, "Use arrows to shift a stop to another day")}</div><aside>${form("activity", "Add a stop", `${field("Activity", "title", "text", { maxLength: 90 })}${field("Place", "place", "text", { maxLength: 70 })}<div class="demo-form-row">${field("Day", "day", "select", { values: days })}${field("Time", "time", "time", { value: "10:00" })}</div>`)}</aside></div>`;
}

function plantStatus(plant) {
  const last = new Date(`${plant.lastWatered || "2026-09-01"}T12:00:00`);
  const elapsed = Math.floor((Date.now() - last.getTime()) / 86_400_000);
  const dueIn = Number(plant.waterEvery) - elapsed;
  return {
    dueIn,
    label:
      dueIn < 0
        ? `${Math.abs(dueIn)} days overdue`
        : dueIn === 0
          ? "Due today"
          : `Due in ${dueIn} days`,
    tone: dueIn <= 0 ? "warning" : "good",
  };
}

function greenhouseView() {
  const plants = data.plants || [];
  const due = plants.filter((plant) => plantStatus(plant).dueIn <= 0).length;
  const plantCards = plants
    .map((plant) => {
      const status = plantStatus(plant);
      return `<article class="demo-item plant-item"><div><span class="plant-art" aria-hidden="true">❋</span><p class="demo-item-title">${escapeHtml(plant.title)}</p><div class="demo-item-detail"><span>${escapeHtml(plant.room)}</span><span>Every ${escapeHtml(plant.waterEvery)} days</span><span class="demo-badge ${status.tone}">${escapeHtml(status.label)}</span></div></div><div class="demo-item-actions"><button class="demo-action" type="button" data-action="water-plant" data-id="${escapeHtml(plant.id)}">Water now</button>${iconButton("plant-delete", plant.id, `Remove ${plant.title}`, "×")}</div></article>`;
    })
    .join("");
  const logs = (data.waterings || []).slice().reverse().slice(0, 5);
  return `<section class="demo-stats">${stat("In your collection", plants.length, "A few green companions")}${stat("Need attention", due, due ? "Check the care list" : "All caught up")}${stat("Watering log", (data.waterings || []).length, "This demo session")}${stat("Care style", "Gentle", "Schedules are reminders")}</section><div class="demo-layout"><div>${panel("Plant care", plants.length ? `<div class="demo-list">${plantCards}</div>` : emptyState("Add a plant to begin your collection."), "Watering records update the schedule")}${panel("Recent care", logs.length ? `<div class="demo-list">${logs.map((log) => `<article class="demo-item"><div><p class="demo-item-title">${escapeHtml(log.title)}</p><div class="demo-item-detail"><span>${escapeHtml(log.date)}</span></div></div><span aria-hidden="true">✓</span></article>`).join("")}</div>` : emptyState("Your care log is ready."))}</div><aside>${form("plant", "Add a plant", `${field("Plant name", "title", "text", { maxLength: 60 })}${field("Room or spot", "room", "text", { maxLength: 50 })}${field("Water every (days)", "waterEvery", "number", { min: "1", maxLength: 3 })}`)}</aside></div>`;
}

function pageturnView() {
  const books = data.books || [];
  const finished = books.filter((book) => book.status === "Finished").length;
  const reading = books.filter((book) => book.status === "Reading").length;
  const bookCards = books
    .map((book) => {
      const progress = Math.min(
        100,
        Math.round(
          (Number(book.currentPage) / Math.max(1, Number(book.pages))) * 100,
        ),
      );
      return `<article class="demo-item book-item"><div><span class="book-art" aria-hidden="true">▤</span><p class="demo-item-title">${escapeHtml(book.title)}</p><div class="demo-item-detail"><span>${escapeHtml(book.author)}</span><span>${escapeHtml(book.currentPage)} / ${escapeHtml(book.pages)} pages</span><span class="demo-badge ${book.status === "Finished" ? "good" : ""}">${escapeHtml(book.status)}</span></div><div class="demo-progress"><span style="width:${progress}%"></span></div></div><div class="demo-item-actions">${iconButton("book-progress", book.id, `Add 10 pages to ${book.title}`, "+10p")}${iconButton("book-status", book.id, `Change status for ${book.title}`, "↻")}${iconButton("book-delete", book.id, `Remove ${book.title}`, "×")}</div></article>`;
    })
    .join("");
  return `<section class="demo-stats">${stat("On your shelf", books.length, "Reading and saved books")}${stat("In progress", reading, "One page at a time")}${stat("Finished", finished, "Books completed")}${stat(
    "Pages logged",
    books.reduce((sum, book) => sum + Number(book.currentPage), 0),
    "Across your shelf",
  )}</section><div class="demo-layout"><div>${panel("Your reading list", books.length ? `<div class="demo-list">${bookCards}</div>` : emptyState("Add a book to start your shelf."), "Add pages or cycle the reading status")}</div><aside>${form("book", "Add a book", `${field("Title", "title", "text", { maxLength: 100 })}${field("Author", "author", "text", { maxLength: 80 })}<div class="demo-form-row">${field("Total pages", "pages", "number", { min: "1", maxLength: 5 })}${field("Status", "status", "select", { values: ["Want to read", "Reading", "Finished"] })}</div>`)}</aside></div>`;
}

function helpdeskView() {
  const tickets = data.tickets || [];
  const statuses = ["Open", "In progress", "Resolved"];
  const priorities = ["Low", "Normal", "High"];
  const ticketCards = tickets
    .map(
      (ticket) =>
        `<article class="demo-ticket"><div class="ticket-title-row"><p>${escapeHtml(ticket.title)}</p><span class="demo-badge ${ticket.status === "Resolved" ? "good" : ""}">${escapeHtml(ticket.status)}</span></div><div class="demo-item-detail"><span>Requester: ${escapeHtml(ticket.requester || "You")}</span><span>${escapeHtml(ticket.updated || "Just now")}</span></div><div class="demo-inline-controls"><label class="visually-hidden" for="status-${escapeHtml(ticket.id)}">Status</label><select id="status-${escapeHtml(ticket.id)}" data-ticket-field="status" data-id="${escapeHtml(ticket.id)}">${statuses.map((status) => `<option ${ticket.status === status ? "selected" : ""}>${status}</option>`).join("")}</select><label class="visually-hidden" for="priority-${escapeHtml(ticket.id)}">Priority</label><select id="priority-${escapeHtml(ticket.id)}" data-ticket-field="priority" data-id="${escapeHtml(ticket.id)}">${priorities.map((priority) => `<option ${ticket.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select>${iconButton("ticket-delete", ticket.id, `Remove ticket: ${ticket.title}`, "×")}</div></article>`,
    )
    .join("");
  return `<section class="demo-stats">${stat("In the queue", tickets.filter((ticket) => ticket.status !== "Resolved").length, "Needs a response")}${stat("Open", tickets.filter((ticket) => ticket.status === "Open").length, "Not picked up")}${stat("High priority", tickets.filter((ticket) => ticket.priority === "High" && ticket.status !== "Resolved").length, "Prioritize with care")}${stat("Resolved", tickets.filter((ticket) => ticket.status === "Resolved").length, "Closed loop")}</section><div class="demo-layout"><div>${panel("Ticket queue", tickets.length ? `<div class="demo-list">${ticketCards}</div>` : emptyState("No requests in your queue."), "Change status or priority inline")}</div><aside>${form("ticket", "Create a ticket", `${field("Issue summary", "title", "text", { maxLength: 120 })}${field("Priority", "priority", "select", { values: priorities })}`)}</aside></div>`;
}

const views = {
  "orbit-finance": orbitView,
  "field-notes": fieldNotesView,
  "common-ground": commonGroundView,
  taskline: tasklineView,
  gather: gatherView,
  waypoint: waypointView,
  greenhouse: greenhouseView,
  pageturn: pageturnView,
  helpdesk: helpdeskView,
};

function render() {
  if (!definition) {
    root.innerHTML = `<main class="demo-container">${emptyState("Unknown project demo.")}<a class="demo-back" href="/">Return to portfolio</a></main>`;
    return;
  }
  document.title = `${definition.title} · Concept demo`;
  root.innerHTML = `<header class="demo-topbar"><a class="demo-brand" href="/"><span class="demo-mark">${definition.mark}</span><span>${escapeHtml(definition.title)}</span></a><div class="demo-top-actions"><a class="demo-back" href="/">← Portfolio</a><button class="demo-quiet-button" type="button" data-action="reset">Reset demo</button><button class="demo-theme" type="button" aria-label="Switch theme" title="Switch theme">${document.documentElement.dataset.theme === "dark" ? "☼" : "☾"}</button></div></header><main class="demo-container"><div class="demo-heading"><div><p class="demo-kicker">${definition.icon} &nbsp; ${escapeHtml(definition.kicker)}</p><h1>${escapeHtml(definition.title)}</h1><p>${escapeHtml(definition.description)}</p></div><span class="demo-label">Self-initiated concept demo</span></div>${views[slug]()}${noticeMarkup()}<p class="demo-reset-note">This is a local concept prototype using illustrative sample data. Your changes are scoped to this browser and project. Reset restores the sample set.</p></main><footer class="demo-footer">A concept by Anas Mohamed <span aria-hidden="true">·</span> No real payments, bookings, or support requests are sent.</footer>`;
  if (slug === "waypoint") {
    const timeInput = root.querySelector('input[name="time"]');
    if (timeInput) {
      timeInput.required = false;
      if (!timeInput.value) timeInput.value = "10:00";
    }
  }
}

async function loadData() {
  const records = await Promise.all(
    definition.collections.map(async (collection) => [
      collection,
      await api.list(collection),
    ]),
  );
  records.forEach(([collection, items]) => {
    data[collection] = items;
  });
}

async function updateRecord(collection, record) {
  const { id, ...body } = record;
  await api.update(collection, id, body);
}

async function perform(operation, message) {
  state.error = "";
  state.notice = "Saving your changes…";
  render();
  try {
    await operation();
    await loadData();
    state.notice = message;
  } catch (error) {
    state.error = error.message;
  }
  render();
}

function valuesFrom(formElement) {
  const formData = new FormData(formElement);
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => {
      if (
        [
          "amount",
          "limit",
          "spent",
          "price",
          "capacity",
          "duration",
          "waterEvery",
          "pages",
          "currentPage",
          "attendees",
        ].includes(key)
      )
        return [key, Number(value)];
      return [key, String(value).trim()];
    }),
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

root.addEventListener("submit", (event) => {
  const formElement = event.target.closest("form[data-form]");
  if (!formElement) return;
  event.preventDefault();
  const formData = valuesFrom(formElement);
  const formType = formElement.dataset.form;
  const collectionByForm = {
    transaction: "transactions",
    budget: "budgets",
    task: "tasks",
    activity: "activities",
    plant: "plants",
    book: "books",
    ticket: "tickets",
  };
  if (formType === "transaction") formData.date ||= today();
  if (formType === "budget") formData.spent = 0;
  if (formType === "task") {
    formData.status = "To do";
    formData.due ||= "No due date";
  }
  if (formType === "plant") formData.lastWatered = today();
  if (formType === "ticket") {
    formData.status = "Open";
    formData.requester = "You";
    formData.updated = "Just now";
  }
  if (formType === "activity") {
    formData.day ||= "Day 1";
    formData.time ||= "10:00";
  }
  if (formType === "book")
    formData.currentPage = formData.status === "Finished" ? formData.pages : 0;
  perform(async () => {
    await api.create(collectionByForm[formType], formData);
    formElement.reset();
  }, "Saved to this demo.");
});

root.addEventListener("change", (event) => {
  if (event.target.matches("[data-ticket-field]")) {
    const ticket = data.tickets.find(
      (item) => item.id === event.target.dataset.id,
    );
    if (!ticket) return;
    const updated = {
      ...ticket,
      [event.target.dataset.ticketField]: event.target.value,
      updated: "Just now",
    };
    perform(() => updateRecord("tickets", updated), "Ticket updated.");
  }
});

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action], .demo-theme");
  if (!button) return;
  if (button.matches(".demo-theme")) {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("anas-theme", nextTheme);
    } catch {}
    render();
    return;
  }
  const { action, id } = button.dataset;
  if (action === "reset") {
    if (!window.confirm("Reset this demo and restore its sample data?")) return;
    state.cart.clear();
    perform(async () => {
      await api.reset();
      await loadData();
    }, "Sample data restored.");
    return;
  }
  if (action === "filter-products") {
    state.productFilter = button.dataset.category;
    render();
    return;
  }
  if (action === "cart-add" || action === "cart-remove") {
    const quantity =
      (state.cart.get(id) || 0) + (action === "cart-add" ? 1 : -1);
    if (quantity > 0) state.cart.set(id, quantity);
    else state.cart.delete(id);
    render();
    return;
  }
  if (action === "checkout") {
    const products = data.products || [];
    const items = [...state.cart.entries()]
      .map(([productId, quantity]) => ({
        product: products.find((product) => product.id === productId),
        quantity,
      }))
      .filter((item) => item.product);
    if (!items.length) return;
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    perform(async () => {
      await api.create("orders", {
        total,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        items: JSON.stringify(
          items.map(
            ({ product, quantity }) => `${product.title} × ${quantity}`,
          ),
        ),
        date: today(),
        status: "Sample order",
      });
      state.cart.clear();
    }, "Sample order placed. No payment was collected.");
    return;
  }
  const operations = {
    "delete-transaction": () => api.remove("transactions", id),
    "delete-budget": () => api.remove("budgets", id),
    "cancel-booking": () => api.remove("bookings", id),
    "task-delete": () => api.remove("tasks", id),
    "activity-delete": () => api.remove("activities", id),
    "plant-delete": () => api.remove("plants", id),
    "book-delete": () => api.remove("books", id),
    "ticket-delete": () => api.remove("tickets", id),
  };
  if (operations[action]) {
    perform(operations[action], "Updated successfully.");
    return;
  }
  if (action === "book-slot") {
    const slot = data.slots.find((item) => item.id === id);
    if (slot)
      perform(
        () =>
          api.create("bookings", {
            title: "Planning session",
            slotId: slot.id,
            date: slot.date,
            time: slot.time,
            status: "Booked",
          }),
        "Time reserved in your demo.",
      );
    return;
  }
  if (action === "rsvp" || action === "cancel-rsvp") {
    const existing = data.rsvps.find((item) => item.eventId === id);
    if (existing)
      perform(() => api.remove("rsvps", existing.id), "RSVP removed.");
    else {
      const selectedEvent = data.events.find((item) => item.id === id);
      if (selectedEvent)
        perform(
          () =>
            api.create("rsvps", {
              eventId: id,
              title: selectedEvent.title,
              date: selectedEvent.date,
              status: "Going",
            }),
          "You're on the list.",
        );
    }
    return;
  }
  if (action === "task-next") {
    const task = data.tasks.find((item) => item.id === id);
    const statuses = ["To do", "In progress", "Done"];
    if (task)
      perform(
        () =>
          updateRecord("tasks", {
            ...task,
            status:
              statuses[(statuses.indexOf(task.status) + 1) % statuses.length],
          }),
        "Task moved forward.",
      );
    return;
  }
  if (action === "activity-move") {
    const activity = data.activities.find((item) => item.id === id);
    const days = ["Day 1", "Day 2", "Day 3"];
    if (activity)
      perform(
        () =>
          updateRecord("activities", {
            ...activity,
            day: days[(days.indexOf(activity.day) + 1) % days.length],
          }),
        "Itinerary updated.",
      );
    return;
  }
  if (action === "water-plant") {
    const plant = data.plants.find((item) => item.id === id);
    if (plant)
      perform(async () => {
        await updateRecord("plants", { ...plant, lastWatered: today() });
        await api.create("waterings", {
          plantId: id,
          title: plant.title,
          date: today(),
        });
      }, `${plant.title} watered. Care schedule updated.`);
    return;
  }
  if (action === "book-progress" || action === "book-status") {
    const book = data.books.find((item) => item.id === id);
    if (!book) return;
    if (action === "book-progress") {
      const currentPage = Math.min(
        Number(book.pages),
        Number(book.currentPage) + 10,
      );
      const status =
        currentPage >= Number(book.pages)
          ? "Finished"
          : currentPage
            ? "Reading"
            : book.status;
      perform(
        () => updateRecord("books", { ...book, currentPage, status }),
        "Reading progress saved.",
      );
    } else {
      const statuses = ["Want to read", "Reading", "Finished"];
      const status =
        statuses[(statuses.indexOf(book.status) + 1) % statuses.length];
      perform(
        () =>
          updateRecord("books", {
            ...book,
            status,
            currentPage: status === "Finished" ? book.pages : book.currentPage,
          }),
        "Reading status updated.",
      );
    }
  }
});

const filterStyles = document.createElement("style");
filterStyles.textContent =
  ".visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.orbit-bars{display:grid;gap:17px}.orbit-bars>div{display:grid;grid-template-columns:65px minmax(0,1fr) auto;align-items:center;gap:10px;font-size:10px}.orbit-bars span{color:var(--muted)}.orbit-bars i{height:8px;background:var(--line)}.orbit-bars i::after{display:block;width:var(--bar);height:100%;background:var(--accent);content:''}.orbit-bars strong{font-size:11px}.demo-filter-row{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:13px}.product-glyph,.plant-art,.book-art{display:grid;width:43px;height:50px;place-items:center;background:var(--accent-soft);color:var(--accent);font-size:22px}.demo-checkout{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}.demo-checkout strong{font-size:12px}.demo-copy{margin:0;color:var(--muted);font-size:11px;line-height:1.7}.plant-item,.book-item{grid-template-columns:minmax(0,1fr) auto}.plant-art,.book-art{float:left;width:36px;height:42px;margin-right:12px}.ticket-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.ticket-title-row p{margin-bottom:0}button:disabled{cursor:not-allowed;opacity:.45}";
document.head.append(filterStyles);

if (definition) {
  loadData()
    .then(render)
    .catch((error) => {
      state.error = error.message;
      render();
    });
} else {
  render();
}
