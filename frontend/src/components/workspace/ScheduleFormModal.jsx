import EnhancedScheduleForm from "./EnhancedScheduleForm";

export default function ScheduleFormModal({
  isOpen,
  scheduleForm,
  onScheduleChange,
  onOperatingDayChange,
  onSaveSchedule,
  onCancelEdit,
  editingScheduleId,
  routes,
  buses,
  saving,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e5dc]">
            <h2 className="text-lg font-semibold text-ink">
              {editingScheduleId ? "Edit Schedule" : "Create Schedule & Publish"}
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="px-6 py-4">
              <EnhancedScheduleForm
                scheduleForm={scheduleForm}
                onScheduleChange={onScheduleChange}
                onOperatingDayChange={onOperatingDayChange}
                onSaveSchedule={(e) => {
                  onSaveSchedule(e);
                  onClose();
                }}
                onCancelEdit={() => {
                  onCancelEdit();
                  onClose();
                }}
                editingScheduleId={editingScheduleId}
                routes={routes}
                buses={buses}
                saving={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
