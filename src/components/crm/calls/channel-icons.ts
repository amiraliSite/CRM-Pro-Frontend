/**
 * آیکون و رنگ هر کانال تماس — مشترک بین ثبت تماس، تماس‌های روز و تماس‌های ماه (تسک ۴۲)
 */
import {
  Phone,
  Send,
  Mail,
  MessageCircle,
  Instagram,
  MessageSquare,
  MapPin,
  CircleEllipsis,
  type LucideIcon,
} from "lucide-react";
import type { CallChannel } from "@/lib/crm/types";

export const CHANNEL_ICON: Record<CallChannel, LucideIcon> = {
  phone: Phone,
  telegram: Send,
  email: Mail,
  whatsapp: MessageCircle,
  instagram: Instagram,
  sms: MessageSquare,
  inperson: MapPin,
  other: CircleEllipsis,
};
