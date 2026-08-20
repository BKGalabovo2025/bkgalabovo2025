$content = Get-Content "d:\FIREBASE STUDIO\bkgalabovo2025\src\app\(protected)\settings\SettingsClient.tsx"
$newContent = $content[0..474]
$newContent += @("
            <TabsContent value="general" className="m-0 focus-visible:outline-none">
              <GeneralTab
                bkgData={bkgData}
                rzData={rzData}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
              />
            </TabsContent>

            <TabsContent value="branding" className="m-0 focus-visible:outline-none">
              <BrandingTab
                bkgData={bkgData}
                rzData={rzData}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
              />
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none">
              <SecurityTab
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                repeatPassword={repeatPassword}
                setRepeatPassword={setRepeatPassword}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showRepeatPassword={showRepeatPassword}
                setShowRepeatPassword={setShowRepeatPassword}
                handleResetPassword={handleResetPassword}
                isSendingReset={isSendingReset}
              />
            </TabsContent>

            <TabsContent value="recovery" className="m-0 focus-visible:outline-none">
              <RecoveryZoneTab
                bkgData={bkgData}
                rzData={rzData}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
                inputClassRz={"h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]"}
                handleScheduleChange={handleScheduleChange}
                handleInventoryChange={handleInventoryChange}
                handleStringArrayChange={handleStringArrayChange}
                addStringArrayItem={addStringArrayItem}
                removeStringArrayItem={removeStringArrayItem}
                handleFaqChange={handleFaqChange}
                addFaq={addFaq}
                removeFaq={removeFaq}
              />
            </TabsContent>

            <TabsContent value="profile" className="m-0 focus-visible:outline-none">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="team" className="m-0 focus-visible:outline-none">
              <TeamTab
                bkgData={bkgData}
                rzData={rzData}
                handleInputChange={handleInputChange}
                inputClass={inputClass}
                labelClass={labelClass}
                handleTherapistChange={handleTherapistChange}
                addTherapist={addTherapist}
                removeTherapist={removeTherapist}
              />
            </TabsContent>

            <TabsContent value="audit" className="m-0 focus-visible:outline-none">
              <AuditLogTab
                auditLogs={auditLogs}
                fetchLogs={fetchLogs}
                loadingLogs={loadingLogs}
              />
            </TabsContent>
")
$newContent += $content[2278..($content.Length - 1)]
Set-Content "d:\FIREBASE STUDIO\bkgalabovo2025\src\app\(protected)\settings\SettingsClient.tsx" -Value $newContent -Encoding UTF8
