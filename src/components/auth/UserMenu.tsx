import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, PALETTES, type Palette } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon, Circle, Sun, Moon, Palette as PaletteIcon, Check } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const roleLabels = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  agent: 'Atendente',
};

export function UserMenu() {
  const { profile, role, signOut } = useAuth();
  const { mode, palette, toggleMode, setPalette } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!profile || !role) {
    return null;
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:bg-accent/50 rounded-lg p-2 transition-colors">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Circle 
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 ${statusColors[profile.status]} border-2 border-background rounded-full`}
              fill="currentColor"
            />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium text-foreground">{profile.full_name}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {roleLabels[role]}
            </Badge>
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleMode}>
          {mode === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>{mode === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon className="mr-2 h-4 w-4" />
            <span>Paleta de cores</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              {PALETTES.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => setPalette(p.id as Palette)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ background: p.swatch }}
                  />
                  <span className="flex-1">{p.label}</span>
                  {palette === p.id && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </DropdownMenu>
  );
}
