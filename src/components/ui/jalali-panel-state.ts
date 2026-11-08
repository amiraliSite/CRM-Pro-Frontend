/** وضعیت باز بودن پنل تقویم شمسی — بین تقویم و دیالوگ‌ها به اشتراک گذاشته می‌شود
 *  تا Esc هنگام باز بودن پنل، دیالوگِ پشت آن را نبندد (ui/dialog.tsx این را چک می‌کند). */

let jalaliPanelOpen = false;

export function setJalaliPanelOpen(v: boolean): void {
  jalaliPanelOpen = v;
}

export function isJalaliPanelOpen(): boolean {
  return jalaliPanelOpen;
}
