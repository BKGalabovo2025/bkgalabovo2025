'use client';

import { useState, useEffect } from 'react';

// Функция за форматиране на датата и часа на български език
const formatDateTime = (date: Date) => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formattedDate = date.toLocaleDateString('bg-BG', dateOptions);
  const formattedTime = date.toLocaleTimeString('bg-BG', timeOptions);

  // Комбиниране на датата и часа, като първата буква на деня от седмицата се прави главна
  return `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}, ${formattedTime}`;
};

const RealTimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Интервал за обновяване на часа всяка секунда
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Почистване на интервала при демонтиране на компонента
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm font-medium text-muted-foreground">
      {formatDateTime(currentTime)}
    </div>
  );
};

export default RealTimeClock;
