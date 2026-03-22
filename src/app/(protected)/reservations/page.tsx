'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AgendaView } from '@/components/reservations/agenda-view';
import { ReservationDialog } from '@/components/reservations/reservation-dialog';
import { BlockSlotDialog } from '@/components/reservations/block-slot-dialog'; // Import the new component

const ReservationsPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const COURT_COUNT = 6;

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSave = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Резервации на корт</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>Днес</Button>
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>&lt;</Button>
          <span className="font-semibold w-36 text-center">
            {currentDate.toLocaleDateString('bg-BG', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextDay}>&gt;</Button>
        </div>
        <div className="flex items-center gap-2">
            <ReservationDialog onSave={handleSave}>
                <Button>+ Нова резервация</Button>
            </ReservationDialog>
            <BlockSlotDialog onSave={handleSave} courtCount={COURT_COUNT}>
                <Button variant="secondary">Блокирай часове</Button>
            </BlockSlotDialog>
        </div>
      </header>

      <AgendaView refreshKey={refreshKey} date={currentDate} courtCount={COURT_COUNT} />
    </div>
  );
};

export default ReservationsPage;
