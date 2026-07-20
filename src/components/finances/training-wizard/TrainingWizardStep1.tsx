"use client";

import { useTrainingWizard } from "./TrainingWizardContext";
import {
  WizardStep1Shell,
  WizardStep1NewGuestForm,
  WizardStep1MemberList,
  useRegisterGuest,
} from "@/components/shared/wizard/WizardStep1Shared";

export const TrainingWizardStep1 = () => {
  const {
    showNewGuestForm,
    setShowNewGuestForm,
    clientTypeTab,
    setClientTypeTab,
    setSelectedMember,
    setIsGuestSale,
    newGuestFirstName,
    setNewGuestFirstName,
    newGuestLastName,
    setNewGuestLastName,
    newGuestPhone,
    setNewGuestPhone,
    newGuestEmail,
    setNewGuestEmail,
    isSavingNewGuest,
    setIsSavingNewGuest,
    searchTerm,
    setSearchTerm,
    membersLoading,
    filteredMembers,
    selectedMember,
    setMembers,
    setStep,
  } = useTrainingWizard();

  const { handleRegisterGuest } = useRegisterGuest({
    newGuestFirstName,
    newGuestLastName,
    newGuestPhone,
    newGuestEmail,
    setIsSavingNewGuest,
    setMembers,
    setSelectedMember,
    setIsGuestSale,
    setShowNewGuestForm,
    setNewGuestFirstName,
    setNewGuestLastName,
    setNewGuestPhone,
    setNewGuestEmail,
    setStep,
  });

  return (
    <WizardStep1Shell
      showNewGuestForm={showNewGuestForm}
      guestForm={
        <WizardStep1NewGuestForm
          newGuestFirstName={newGuestFirstName}
          setNewGuestFirstName={setNewGuestFirstName}
          newGuestLastName={newGuestLastName}
          setNewGuestLastName={setNewGuestLastName}
          newGuestPhone={newGuestPhone}
          setNewGuestPhone={setNewGuestPhone}
          newGuestEmail={newGuestEmail}
          setNewGuestEmail={setNewGuestEmail}
          isSavingNewGuest={isSavingNewGuest}
          setShowNewGuestForm={setShowNewGuestForm}
          handleRegisterGuest={handleRegisterGuest}
        />
      }
      clientTypeTab={clientTypeTab}
      setClientTypeTab={setClientTypeTab}
      setSelectedMember={setSelectedMember}
      setIsGuestSale={setIsGuestSale}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      setShowNewGuestForm={setShowNewGuestForm}
      membersLoading={membersLoading}
      memberList={
        <WizardStep1MemberList
          filteredMembers={filteredMembers}
          selectedMember={selectedMember}
          clientTypeTab={clientTypeTab}
          setSelectedMember={setSelectedMember}
          setIsGuestSale={setIsGuestSale}
        />
      }
    />
  );
};
