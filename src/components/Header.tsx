import React from 'react'
import { FileSearch, Github, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    isDarkMode: boolean
    onToggleDarkMode: () => void
}

export function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <FileSearch className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">Metadata Viewer</h1>
                            <p className="text-xs text-muted-foreground">Analyze file metadata instantly</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleDarkMode}
                        className="h-9 w-9 p-0"
                    >
                        {isDarkMode ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-9 w-9 p-0"
                    >
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View on GitHub"
                        >
                            <Github className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    )
}