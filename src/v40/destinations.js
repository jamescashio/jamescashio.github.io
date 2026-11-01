export const destinations = [
  ["top", "Home", "The machines can think. You still decide. Orbit"],
  ["contact", "Contact Doug", "Email, speaking, mentoring and comparing notes"],
  ["eagle-film", "House Cashio", "Watch the 61 second trailer. The crew, Bit and a cat"],
  ["workshop", "Projects", "Inside the workshop. Real work, backups and a decision brief"],
  ["studies", "Experiments", "Seven experiments. Take the controls"],
  ["rooms", "Worlds", "Starship, principles, studios and flight heritage"],
  ["films", "Films", "House Cashio, The Sovereign and the short film collection"],
  ["work", "Quick decision", "Privacy, human judgment and the routing law"],
  ["universe", "System map", "HERMES, Zeus, Apollo and a request trace"],
  ["evidence", "Evidence", "Dated records and E.V.E. answers"],
  ["operator", "About Doug", "The human in command"],
];

export const destinationLabel = (id) => destinations.find(([key]) => key === id)?.[1] || id;
