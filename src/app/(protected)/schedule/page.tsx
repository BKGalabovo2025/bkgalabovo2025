
// src/app/schedule/page.tsx

import { Training, Competition, Camp, ClubEvent } from '@/types';

const SchedulePage = () => {
  // Placeholder for schedule data
  const trainings: Training[] = [];
  const competitions: Competition[] = [];
  const camps: Camp[] = [];
  const clubEvents: ClubEvent[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">График и събития</h1>
      {/* Schedule and events interface will go here */}
      <p>Календар на тренировките, състезанията и събитията.</p>
    </div>
  );
};

export default SchedulePage;
