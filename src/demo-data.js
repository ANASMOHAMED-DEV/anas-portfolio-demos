export const projects = {
  "orbit-finance": {
    title: "Orbit Finance",
    collections: {
      transactions: [
        {
          id: "tx-1",
          title: "Monthly salary",
          amount: 5200,
          type: "income",
          category: "Income",
          date: "2026-10-01",
        },
        {
          id: "tx-2",
          title: "Apartment rent",
          amount: 1650,
          type: "expense",
          category: "Home",
          date: "2026-10-02",
        },
        {
          id: "tx-3",
          title: "Weekly groceries",
          amount: 86.4,
          type: "expense",
          category: "Food",
          date: "2026-10-03",
        },
        {
          id: "tx-4",
          title: "Design subscription",
          amount: 28,
          type: "expense",
          category: "Tools",
          date: "2026-10-04",
        },
      ],
      budgets: [
        { id: "budget-1", title: "Food", limit: 420, spent: 186.4 },
        { id: "budget-2", title: "Home", limit: 1800, spent: 1650 },
        { id: "budget-3", title: "Tools", limit: 120, spent: 58 },
      ],
    },
  },
  "field-notes": {
    title: "Field Notes",
    collections: {
      products: [
        {
          id: "product-1",
          title: "Everyday notebook",
          price: 18,
          category: "Paper",
          detail: "Lay-flat pages, made for daily ideas.",
        },
        {
          id: "product-2",
          title: "Pocket journal",
          price: 12,
          category: "Paper",
          detail: "A small companion for the in-between.",
        },
        {
          id: "product-3",
          title: "Brass page marker",
          price: 9,
          category: "Tools",
          detail: "A simple marker that ages beautifully.",
        },
        {
          id: "product-4",
          title: "Weekly desk pad",
          price: 16,
          category: "Planning",
          detail: "A calmer way to map your week.",
        },
      ],
      orders: [],
    },
  },
  "common-ground": {
    title: "Common Ground",
    collections: {
      slots: [
        {
          id: "slot-1",
          title: "Tuesday · 10:00",
          date: "2026-10-06",
          time: "10:00",
          duration: 60,
        },
        {
          id: "slot-2",
          title: "Tuesday · 14:00",
          date: "2026-10-06",
          time: "14:00",
          duration: 60,
        },
        {
          id: "slot-3",
          title: "Wednesday · 11:00",
          date: "2026-10-07",
          time: "11:00",
          duration: 60,
        },
        {
          id: "slot-4",
          title: "Thursday · 15:00",
          date: "2026-10-08",
          time: "15:00",
          duration: 60,
        },
      ],
      bookings: [],
    },
  },
  taskline: {
    title: "Taskline",
    collections: {
      tasks: [
        {
          id: "task-1",
          title: "Map the first release",
          status: "In progress",
          priority: "High",
          due: "2026-10-08",
        },
        {
          id: "task-2",
          title: "Review the component library",
          status: "To do",
          priority: "Medium",
          due: "2026-10-10",
        },
        {
          id: "task-3",
          title: "Ship the onboarding flow",
          status: "Done",
          priority: "High",
          due: "2026-10-01",
        },
      ],
    },
  },
  gather: {
    title: "Gather",
    collections: {
      events: [
        {
          id: "event-1",
          title: "Small web, big ideas",
          date: "2026-10-10",
          venue: "Studio 14",
          category: "Talk",
          capacity: 24,
          attendees: 12,
        },
        {
          id: "event-2",
          title: "A morning with type",
          date: "2026-10-12",
          venue: "The Reading Room",
          category: "Workshop",
          capacity: 16,
          attendees: 8,
        },
        {
          id: "event-3",
          title: "Make something together",
          date: "2026-10-17",
          venue: "Garden Hall",
          category: "Meetup",
          capacity: 32,
          attendees: 18,
        },
      ],
      rsvps: [],
    },
  },
  waypoint: {
    title: "Waypoint",
    collections: {
      activities: [
        {
          id: "activity-1",
          title: "Arrive and check in",
          day: "Day 1",
          time: "14:00",
          place: "Old Town",
        },
        {
          id: "activity-2",
          title: "Market breakfast",
          day: "Day 2",
          time: "09:00",
          place: "Central Market",
        },
        {
          id: "activity-3",
          title: "Museum visit",
          day: "Day 2",
          time: "13:30",
          place: "Design Museum",
        },
      ],
    },
  },
  greenhouse: {
    title: "Greenhouse",
    collections: {
      plants: [
        {
          id: "plant-1",
          title: "Monstera",
          room: "Living room",
          waterEvery: 7,
          lastWatered: "2026-09-28",
        },
        {
          id: "plant-2",
          title: "Pilea",
          room: "Desk",
          waterEvery: 5,
          lastWatered: "2026-09-29",
        },
        {
          id: "plant-3",
          title: "Snake plant",
          room: "Bedroom",
          waterEvery: 14,
          lastWatered: "2026-09-25",
        },
      ],
      waterings: [],
    },
  },
  pageturn: {
    title: "PageTurn",
    collections: {
      books: [
        {
          id: "book-1",
          title: "The Creative Act",
          author: "Rick Rubin",
          pages: 432,
          currentPage: 168,
          status: "Reading",
        },
        {
          id: "book-2",
          title: "Ways of Seeing",
          author: "John Berger",
          pages: 176,
          currentPage: 176,
          status: "Finished",
        },
        {
          id: "book-3",
          title: "A Field Guide to Getting Lost",
          author: "Rebecca Solnit",
          pages: 224,
          currentPage: 0,
          status: "Want to read",
        },
      ],
    },
  },
  helpdesk: {
    title: "Helpdesk",
    collections: {
      tickets: [
        {
          id: "ticket-1",
          title: "Invoice download is blank",
          status: "Open",
          priority: "High",
          requester: "Sam R.",
          updated: "Today",
        },
        {
          id: "ticket-2",
          title: "How do I change my email?",
          status: "In progress",
          priority: "Normal",
          requester: "Taylor K.",
          updated: "Yesterday",
        },
        {
          id: "ticket-3",
          title: "Thanks for the quick fix",
          status: "Resolved",
          priority: "Low",
          requester: "Jordan M.",
          updated: "Oct 1",
        },
      ],
    },
  },
};
