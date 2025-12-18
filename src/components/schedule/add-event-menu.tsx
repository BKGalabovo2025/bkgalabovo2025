'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Fab } from "@/components/ui/fab";
import { CalendarPlus, Trophy, Tent, Plus, Calendar as CalendarIcon } from "lucide-react";

interface AddEventMenuProps {
  onSelect: (type: 'training' | 'monthly-schedule' | 'competition' | 'camp' | 'event') => void;
}

export default function AddEventMenu({ onSelect }: AddEventMenuProps) {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Fab>
                <Plus />
            </Fab>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuItem onClick={() => onSelect('training')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Тренировка</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect('monthly-schedule')}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                <span>Месечен график</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect('competition')}>
                <Trophy className="mr-2 h-4 w-4" />
                <span>Състезание</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect('camp')}>
                <Tent className="mr-2 h-4 w-4" />
                <span>Лагер</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect('event')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Друго събитие</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
