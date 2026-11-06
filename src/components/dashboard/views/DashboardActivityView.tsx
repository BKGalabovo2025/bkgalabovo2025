"use client";

import React from "react";

import { BirthdayReminder } from "../BirthdayReminder";
import { DashboardNotifications } from "../dashboard-notifications";
import { useDashboardContext } from "../DashboardContext";
import { FeedbackDashboardCard } from "../FeedbackDashboardCard";
import { InquiriesNotificationCard } from "../InquiriesNotificationCard";

export function DashboardActivityView() {
  const { reminders, isRecoveryZone } = useDashboardContext();

  return (
    <div className="space-y-5 duration-500 animate-in fade-in">
      {/* 2-Column Balanced Activity Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Reminders & Notifications */}
        <div className="space-y-4">
          <DashboardNotifications reminders={isRecoveryZone ? [] : reminders} />
          <BirthdayReminder />
        </div>

        {/* Inquiries & Customer Feedback */}
        <div className="space-y-4">
          <InquiriesNotificationCard />
          <FeedbackDashboardCard />
        </div>
      </div>
    </div>
  );
}
