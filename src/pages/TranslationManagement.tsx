import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages, Plus, Edit, Trash2, Globe, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Language = Tables<'languages'>;
type Translation = Tables<'translations'>;

export default function TranslationManagement() {
  const { 
    translations, 
    languages, 
    loading, 
    createTranslation, 
    updateTranslation, 
    deleteTranslation,
    createLanguage,
    updateLanguage,
    deleteLanguage 
  } = useTranslations();
  
  const { t, refreshTranslations } = useLanguage();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);

  // Form states
  const [translationForm, setTranslationForm] = useState({
    language_id: '',
    translation_key: '',
    translation_value: '',
    category: 'general',
  });

  const [languageForm, setLanguageForm] = useState({
    code: '',
    name: '',
    native_name: '',
    is_rtl: false,
    is_active: true,
  });

  // Get unique categories
  const categories = Array.from(new Set(translations.map(t => t.category).filter(Boolean)));

  // Filter translations
  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = translation.translation_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         translation.translation_value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || translation.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || translation.language_id === selectedLanguage;
    
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const handleCreateTranslation = async () => {
    try {
      await createTranslation(translationForm);
      setTranslationForm({
        language_id: '',
        translation_key: '',
        translation_value: '',
        category: 'general',
      });
      setIsTranslationDialogOpen(false);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Translation created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create translation",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTranslation = async () => {
    if (!editingTranslation) return;
    
    try {
      await updateTranslation(editingTranslation.id, {
        translation_key: editingTranslation.translation_key,
        translation_value: editingTranslation.translation_value,
        category: editingTranslation.category,
      });
      setEditingTranslation(null);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Translation updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update translation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTranslation = async (id: string) => {
    try {
      await deleteTranslation(id);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Translation deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete translation",
        variant: "destructive",
      });
    }
  };

  const handleCreateLanguage = async () => {
    try {
      await createLanguage(languageForm);
      setLanguageForm({
        code: '',
        name: '',
        native_name: '',
        is_rtl: false,
        is_active: true,
      });
      setIsLanguageDialogOpen(false);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Language created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create language",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLanguage = async () => {
    if (!editingLanguage) return;
    
    try {
      await updateLanguage(editingLanguage.id, {
        name: editingLanguage.name,
        native_name: editingLanguage.native_name,
        is_rtl: editingLanguage.is_rtl,
        is_active: editingLanguage.is_active,
      });
      setEditingLanguage(null);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Language updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update language",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLanguage = async (id: string) => {
    try {
      await deleteLanguage(id);
      await refreshTranslations();
      toast({
        title: "Success",
        description: "Language deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete language",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translation Management</h1>
          <p className="text-muted-foreground">
            Manage languages and translations for the application
          </p>
        </div>
      </div>

      <Tabs defaultValue="translations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="translations" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Languages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="translations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Translations
                  <Badge variant="secondary">{filteredTranslations.length}</Badge>
                </CardTitle>
                <Dialog open={isTranslationDialogOpen} onOpenChange={setIsTranslationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Translation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Translation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={translationForm.language_id}
                          onValueChange={(value) => setTranslationForm(prev => ({ ...prev, language_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language..." />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.id} value={lang.id}>
                                {lang.native_name} ({lang.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="key">Translation Key</Label>
                        <Input
                          id="key"
                          value={translationForm.translation_key}
                          onChange={(e) => setTranslationForm(prev => ({ ...prev, translation_key: e.target.value }))}
                          placeholder="e.g., common.save"
                        />
                      </div>
                      <div>
                        <Label htmlFor="value">Translation Value</Label>
                        <Textarea
                          id="value"
                          value={translationForm.translation_value}
                          onChange={(e) => setTranslationForm(prev => ({ ...prev, translation_value: e.target.value }))}
                          placeholder="Enter translation..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={translationForm.category}
                          onChange={(e) => setTranslationForm(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., common, navigation"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsTranslationDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTranslation}>
                          Create Translation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search translations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Filter by category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Filter by language..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.native_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Translations List */}
              <div className="space-y-2">
                {filteredTranslations.map((translation) => (
                  <div
                    key={translation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {translation.translation_key}
                        </code>
                        <Badge variant="outline">{translation.category}</Badge>
                        <Badge variant="secondary">
                          {translation.language?.native_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {translation.translation_value}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTranslation({ ...translation })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Translation</DialogTitle>
                          </DialogHeader>
                          {editingTranslation && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-key">Translation Key</Label>
                                <Input
                                  id="edit-key"
                                  value={editingTranslation.translation_key}
                                  onChange={(e) => setEditingTranslation(prev => ({ ...prev, translation_key: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-value">Translation Value</Label>
                                <Textarea
                                  id="edit-value"
                                  value={editingTranslation.translation_value}
                                  onChange={(e) => setEditingTranslation(prev => ({ ...prev, translation_value: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-category">Category</Label>
                                <Input
                                  id="edit-category"
                                  value={editingTranslation.category}
                                  onChange={(e) => setEditingTranslation(prev => ({ ...prev, category: e.target.value }))}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingTranslation(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateTranslation}>
                                  Update
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Translation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this translation? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTranslation(translation.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {filteredTranslations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery || selectedCategory !== 'all' || selectedLanguage !== 'all' 
                      ? 'No translations found matching your filters.'
                      : 'No translations found.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Languages
                  <Badge variant="secondary">{languages.length}</Badge>
                </CardTitle>
                <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Language
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Language</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="code">Language Code</Label>
                        <Input
                          id="code"
                          value={languageForm.code}
                          onChange={(e) => setLanguageForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g., en, ar, fr"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">English Name</Label>
                        <Input
                          id="name"
                          value={languageForm.name}
                          onChange={(e) => setLanguageForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., English, Arabic, French"
                        />
                      </div>
                      <div>
                        <Label htmlFor="native_name">Native Name</Label>
                        <Input
                          id="native_name"
                          value={languageForm.native_name}
                          onChange={(e) => setLanguageForm(prev => ({ ...prev, native_name: e.target.value }))}
                          placeholder="e.g., English, العربية, Français"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_rtl"
                          checked={languageForm.is_rtl}
                          onCheckedChange={(checked) => setLanguageForm(prev => ({ ...prev, is_rtl: checked }))}
                        />
                        <Label htmlFor="is_rtl">Right-to-Left (RTL)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={languageForm.is_active}
                          onCheckedChange={(checked) => setLanguageForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsLanguageDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateLanguage}>
                          Create Language
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {languages.map((language) => (
                  <div
                    key={language.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{language.native_name}</h3>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {language.code}
                        </code>
                        {language.is_rtl && (
                          <Badge variant="outline">RTL</Badge>
                        )}
                        {!language.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLanguage({ ...language })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Language</DialogTitle>
                          </DialogHeader>
                          {editingLanguage && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">English Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editingLanguage.name}
                                  onChange={(e) => setEditingLanguage(prev => ({ ...prev!, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-native-name">Native Name</Label>
                                <Input
                                  id="edit-native-name"
                                  value={editingLanguage.native_name}
                                  onChange={(e) => setEditingLanguage(prev => ({ ...prev!, native_name: e.target.value }))}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-is-rtl"
                                  checked={editingLanguage.is_rtl}
                                  onCheckedChange={(checked) => setEditingLanguage(prev => ({ ...prev!, is_rtl: checked }))}
                                />
                                <Label htmlFor="edit-is-rtl">Right-to-Left (RTL)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-is-active"
                                  checked={editingLanguage.is_active}
                                  onCheckedChange={(checked) => setEditingLanguage(prev => ({ ...prev!, is_active: checked }))}
                                />
                                <Label htmlFor="edit-is-active">Active</Label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditingLanguage(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateLanguage}>
                                  Update
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Language</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this language? This will also delete all associated translations. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLanguage(language.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}

                {languages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No languages found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}