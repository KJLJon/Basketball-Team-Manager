# Pages

**Routes**: / (Home), /players, /schedule, /game/:id/setup (GameSetupPage), /game/:id (GameDayPage), /training, /stats, /stats/player/:id

**Home.tsx**: Logo, quick stats, active game banner, upcoming games, import/export, build timestamp

**Players.tsx**: PlayerList + PlayerForm, edit/delete

**Schedule.tsx**: Game list, add form (opponent/date/location)

**GameSetupPage.tsx**: Attendance checkboxes, start game → GameDayPage

**GameDayPage.tsx**: Loads game, renders GameDay component

**Training.tsx**: 6 plays, BasketballCourt, step controls, `fiveOutPlays` array

**Stats.tsx**: StatsDashboard wrapper, season stats

**Hooks**: usePlayers (players, loading, refresh), useGames (games, loading, refresh), useServiceWorker (showUpdateBanner, updateServiceWorker, dismissUpdate)

**Game Flow**: /schedule → /game/:id/setup → /game/:id → ends → /schedule
