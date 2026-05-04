'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileCategories } from "@/lib/profile-config";
import { CategoryDisplay } from "./CategoryDisplay";

export function CharacterInventory() {

    return (
         <Card>
            <CardHeader>
                <CardTitle>Inventário do Personagem</CardTitle>
                <CardDescription>Gerencie todos os seus itens, poderes e equipamentos em um só lugar.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="powers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto">
                        {profileCategories.map(category => (
                            <TabsTrigger key={category.subcollectionName} value={category.subcollectionName}>{category.name}</TabsTrigger>
                        ))}
                    </TabsList>

                     {profileCategories.map((category) => (
                        <TabsContent key={category.subcollectionName} value={category.subcollectionName} className="mt-4">
                            <CategoryDisplay 
                                subcollectionName={category.subcollectionName} 
                                isInteractiveGrid={category.isInteractiveGrid}
                                isWeaponSlots={category.isWeaponSlots}
                                isFighterSlots={(category as any).isFighterSlots}
                                isJewelrySlots={(category as any).isJewelrySlots}
                                itemTypeFilter={category.itemTypeFilter}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
