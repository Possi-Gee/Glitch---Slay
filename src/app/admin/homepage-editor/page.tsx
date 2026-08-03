
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useHomepage, type Promotion } from '@/hooks/use-homepage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, PlusCircle, GripVertical, Home, Loader2, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

const promotionSchema = z.object({
  id: z.number(),
  type: z.enum(['image', 'welcome']),
  content: z.string().min(1, 'Content is required'),
  alt: z.string().optional(),
  dataAiHint: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
});

const editorSchema = z.object({
  callToAction: z.object({
    text: z.string().min(1, 'Call to action text is required'),
    active: z.boolean(),
  }),
  promotions: z.array(promotionSchema),
  flashSale: z.object({
    endDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val) && !isNaN(Date.parse(val)), {
      message: "Please enter a valid date and time.",
    }),
  }),
});

type EditorFormValues = z.infer<typeof editorSchema>;

export default function HomepageEditorPage() {
  const { state, updateHomepage } = useHomepage();
  const { toast } = useToast();

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<EditorFormValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      callToAction: state.callToAction,
      promotions: state.promotions,
      flashSale: state.flashSale,
    },
  });
  
  useEffect(() => {
    reset({
      callToAction: state.callToAction,
      promotions: state.promotions,
      flashSale: state.flashSale,
    });
  }, [state, reset]);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'promotions',
  });

  const onSubmit = async (data: EditorFormValues) => {
    try {
      await updateHomepage(data);
      toast({
        title: 'Homepage Updated',
        description: 'Your homepage content has been saved successfully.',
      });
    } catch(error) {
       toast({
        title: 'Update Failed',
        description: 'Could not save homepage content to the database.',
        variant: 'destructive'
      });
      console.error("Failed to update homepage:", error);
    }
  };

  const addPromotion = (type: 'image' | 'welcome') => {
    const newPromotion: Promotion = {
      id: Date.now(),
      type,
      content: type === 'image' ? 'https://picsum.photos/1200/400' : 'New Welcome Message',
      alt: type === 'image' ? 'New Promotion' : undefined,
      dataAiHint: type === 'image' ? 'promotion image' : undefined,
      title: type === 'welcome' ? 'Welcome Title' : undefined,
      subtitle: type === 'welcome' ? 'Welcome Subtitle' : undefined,
      buttonText: type === 'welcome' ? 'Click Here' : undefined,
      buttonLink: type === 'welcome' ? '/' : undefined,
    };
    append(newPromotion);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Home className="h-8 w-8" />
        <div>
           <h1 className="text-3xl font-bold">Homepage Editor</h1>
           <p className="text-muted-foreground mt-2">Manage the content displayed on your homepage.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Call to Action Bar</CardTitle>
            <CardDescription>The announcement bar displayed at the very top of the homepage. Toggle it on to show it to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {watch('callToAction.active') ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Show Announcement Bar</p>
                  <p className="text-xs text-muted-foreground">
                    {watch('callToAction.active') ? 'Visible to all visitors' : 'Hidden from visitors'}
                  </p>
                </div>
              </div>
              <Controller
                control={control}
                name="callToAction.active"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <Label htmlFor="cta-text">Message</Label>
            <Input id="cta-text" placeholder="e.g. FREE DELIVERY ON ORDERS OVER GHC 500 🚚" {...register('callToAction.text')} />
            {errors.callToAction?.text && <p className="text-sm text-destructive mt-1">{errors.callToAction.text.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flash Sale</CardTitle>
            <CardDescription>Set the end date and time for the countdown timer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="flash-sale-date">End Date</Label>
            <Input id="flash-sale-date" type="datetime-local" {...register('flashSale.endDate')} />
            {errors.flashSale?.endDate && <p className="text-sm text-destructive mt-1">{errors.flashSale.endDate.message}</p>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Promotional Carousel</CardTitle>
            <CardDescription>Manage the slides in the main homepage carousel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/50">
                 <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Slide {index + 1}</h4>
                  <div className='flex items-center gap-2'>
                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}>
                       <GripVertical className="h-5 w-5" />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                   <Controller
                    control={control}
                    name={`promotions.${index}.type`}
                    render={({ field: { onChange, value } }) => (
                      <Select onValueChange={onChange} defaultValue={value}>
                        <SelectTrigger><SelectValue placeholder="Select slide type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome Message</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {field.type === 'welcome' ? (
                     <>
                        <Label>Title</Label><Input {...register(`promotions.${index}.title`)} />
                        <Label>Subtitle</Label><Input {...register(`promotions.${index}.subtitle`)} />
                        <Label>Button Text</Label><Input {...register(`promotions.${index}.buttonText`)} />
                        <Label>Button Link</Label><Input {...register(`promotions.${index}.buttonLink`)} />
                     </>
                  ) : (
                     <>
                        <Label>Image URL</Label><Input {...register(`promotions.${index}.content`)} />
                        <Label>Alt Text</Label><Input {...register(`promotions.${index}.alt`)} />
                        <Label>AI Hint</Label><Input {...register(`promotions.${index}.dataAiHint`)} />
                     </>
                  )}
                </div>
              </Card>
            ))}
             <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => addPromotion('welcome')}>
                <PlusCircle className="mr-2" /> Add Welcome Slide
              </Button>
              <Button type="button" variant="outline" onClick={() => addPromotion('image')}>
                <PlusCircle className="mr-2" /> Add Image Slide
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
