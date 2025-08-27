"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Category {
    id: string
    name: string
    projectCount: number
}

interface CategoryComboboxProps {
    categories: Category[]
    value?: string
    hasExactMatch?: boolean
    searchTerm?: string
    onSearchChange?: (value: string) => void
    onValueChange: (value: string, isNewCategory?: boolean, newCategoryName?: string) => void
    placeholder?: string
    disabled?: boolean
}

export function CategoryCombobox({
    categories,
    value,
    hasExactMatch = false,
    searchTerm = "",
    onSearchChange,
    onValueChange,
    placeholder = "Select or create a category",
    disabled = false,
}: CategoryComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    // Sort categories by project count (most used first)
    const sortedCategories = [...categories].sort((a, b) => b.projectCount - a.projectCount)

    // Get most used categories (top 3)
    const mostUsedCategories = sortedCategories.slice(0, 3)

    // Filter categories based on search
    const filteredCategories = searchValue
        ? categories.filter(category =>
            category.name.toLowerCase().includes(searchValue.toLowerCase())
        )
        : []

    // Use backend hasExactMatch if available, otherwise calculate locally
    const exactMatch = hasExactMatch || categories.some(cat =>
        cat.name.toLowerCase() === searchValue.toLowerCase()
    )

    // Show create option when there's a search value, no exact match, and search is not empty
    const showCreateOption = searchValue && !exactMatch && searchValue.trim().length > 0

    const handleSelect = (selectedValue: string) => {
        if (selectedValue === "new") {
            // User wants to create a new category
            onValueChange("", true, searchValue)
        } else {
            // User selected an existing category
            onValueChange(selectedValue, false)
        }
        setOpen(false)
        setSearchValue("")
    }

    const handleCreateNew = () => {
        onValueChange("", true, searchValue)
        setOpen(false)
        setSearchValue("")
    }

    const selectedCategory = categories.find(cat => cat.id === value)

    console.log("searchTerm", searchTerm, hasExactMatch, showCreateOption, searchValue.trim().length > 0)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedCategory ? (
                        selectedCategory.name
                    ) : (
                        placeholder
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search categories..."
                        value={searchValue}
                        onValueChange={(value) => {
                            setSearchValue(value)
                            onSearchChange?.(value)
                        }}
                    />
                    <CommandList>
                        {/* Most Used Categories */}
                        {mostUsedCategories.length > 0 && (
                            <>
                                <CommandGroup heading="Most Used">
                                    {mostUsedCategories.map((category) => (
                                        <CommandItem
                                            key={category.id}
                                            value={category.id}
                                            onSelect={() => handleSelect(category.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === category.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {category.name}
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {category.projectCount} projects
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                            </>
                        )}

                        {/* Search Results */}
                        {searchValue.trim().length > 0 && (
                            <CommandGroup heading="Search Results">
                                {filteredCategories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.id}
                                        onSelect={() => handleSelect(category.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.name}
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {category.projectCount} projects
                                        </span>
                                    </CommandItem>
                                ))}


                                {/* Create New Category Option */}
                                {showCreateOption && (
                                    <CommandItem>
                                        <Button onClick={handleCreateNew} variant="outline" className="w-full justify-between border-none">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create: {searchValue.charAt(0).toUpperCase() + searchValue.slice(1)}
                                        </Button>
                                    </CommandItem>
                                )}

                                {/* Show message when no results and no create option */}
                                {filteredCategories.length === 0 && !showCreateOption && (
                                    <CommandItem className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No categories found
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        )}


                        {/* Create New Category Button */}
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                value="new-category"
                                onSelect={() => handleSelect("new")}
                                className="text-primary"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Type to create a new category
                            </CommandItem>
                        </CommandGroup>

                        {!searchValue && filteredCategories.length === 0 && (
                            <CommandEmpty>No categories found.</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
