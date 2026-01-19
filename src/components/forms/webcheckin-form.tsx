"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  validateBoardingPass,
  BoardingPassResult,
} from "@/lib/boarding-pass-validation";
import { FiDownload, FiArrowLeft, FiLoader, FiAlertCircle, FiMail } from "react-icons/fi";
import { HiOutlineTicket, HiOutlineIdentification } from "react-icons/hi2";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types
interface Participant {
  uid: string;
  email: string;
  teamName: string;
  siteName: string;
}

// Zod schema for form validation
const formSchema = z.object({
  uid: z
    .string()
    .min(1, "UID is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const BoardingPassValidator = () => {
  // States
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [cardData, setCardData] = useState<BoardingPassResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fileNotFound, setFileNotFound] = useState(false);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uid: "",
      email: "",
    },
    mode: "onChange",
  });

  // Fetch participant data on mount
  useEffect(() => {
    const fetchAndValidate = async () => {
      setIsLoading(true);
      setFileNotFound(false);
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          
          // Debug: Log the API response to see the structure
        //   console.log("API Response:", data);
          
          // Based on route.ts: user object has uid, email at root level
          // and participant as nested object
          const participantData: Participant = {
            uid: data.uid || "",
            email: data.email || "",
            teamName: data.participant?.teamName || "",
            siteName: data.participant?.siteName || "",
          };
          
          // Debug: Log the extracted participant data
        //   console.log("Extracted Participant Data:", participantData);
          
          setParticipant(participantData);

          // Validate boarding pass
          if (participantData.teamName && participantData.siteName) {
            try {
              const result = await validateBoardingPass(
                participantData.teamName,
                participantData.siteName
              );
              if (result && result.boardingPassUrl) {
                setCardData(result);
              } else {
                setFileNotFound(true);
              }
            } catch {
              setFileNotFound(true);
            }
          } else {
            setFileNotFound(true);
          }
        } else {
          setParticipant(null);
          setCardData(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setParticipant(null);
        setCardData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndValidate();
  }, []);

  // Form submit handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!participant) {
      setSubmitError("Unable to verify. Please try again later.");
      setIsSubmitting(false);
      return;
    }

    // Debug: Log comparison values
    console.log("Form UID:", values.uid, "| Participant UID:", participant.uid);
    console.log("Form Email:", values.email, "| Participant Email:", participant.email);

    // Case-sensitive comparison
    const uidMatch = values.uid === participant.uid;
    const emailMatch = values.email === participant.email;

    console.log("UID Match:", uidMatch, "| Email Match:", emailMatch);

    if (uidMatch && emailMatch) {
      setIsValidated(true);
      setSubmitError(null);
    } else {
      // More specific error message
      if (!uidMatch && !emailMatch) {
        setSubmitError("Both UID and Email do not match our records.");
      } else if (!uidMatch) {
        setSubmitError("UID does not match our records. Please check and try again.");
      } else {
        setSubmitError("Email does not match our records. Please check and try again.");
      }
    }

    setIsSubmitting(false);
  };

  // Contact Us Component
  const ContactUsSection = () => (
    <div className="mt-6 p-4 border border-dashed rounded-lg bg-muted/50">
      <div className="flex flex-col items-center gap-2 text-center">
        {/* <FiAlertCircle className="h-6 w-6 text-muted-foreground" /> */}
        <p className="text-sm text-muted-foreground">
          Boarding pass not found for your team. Please contact us for assistance.
        </p>
        <a
          href="mailto:icpcamrita@am.amrita.edu"
          className="flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <FiMail className="h-4 w-4" />
          icpcamrita@am.amrita.edu
        </a>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-3">
              <FiLoader className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - Show boarding pass and passport
  if (isValidated && cardData) {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <div className="w-full max-w-lg space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Boarding Pass Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineTicket className="h-5 w-5" />
                Boarding Pass
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-medium">{cardData.renamedFilename}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">SiteName</span>
                  <span className="font-medium">{cardData.campus}</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <a href={cardData.boardingPassUrl} download className="flex items-center justify-center gap-2">
                  <FiDownload className="h-4 w-4" />
                  Download Boarding Pass
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Passport Pass Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineIdentification className="h-5 w-5" />
                Passport Pass
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">UID</span>
                  <span className="font-medium font-mono">{participant?.uid}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-sm">{participant?.email}</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <a href={cardData.passportUrl} download className="flex items-center justify-center gap-2">
                  <FiDownload className="h-4 w-4" />
                  Download Passport
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Back button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              setIsValidated(false);
              form.reset();
            }}
          >
            <FiArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Success state but file not found - Show contact info
  if (isValidated && fileNotFound) {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <div className="w-full max-w-lg space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineTicket className="h-5 w-5" />
                Boarding Pass
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-medium">{participant?.teamName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-medium">{participant?.siteName}</span>
                </div>
              </div>
              <ContactUsSection />
            </CardContent>
          </Card>

          {/* Back button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              setIsValidated(false);
              form.reset();
            }}
          >
            <FiArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex items-center justify-center p-4 w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <HiOutlineTicket className="h-5 w-5" />
            Validate Boarding Pass
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your UID"
                        className="font-mono"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitError && (
                <div className="flex items-center gap-2 text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                  <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Validating...
                  </span>
                ) : (
                  "Validate"
                )}
              </Button>
            </form>
          </Form>

          {/* Show contact us if file not found during initial load */}
          {fileNotFound && <ContactUsSection />}
        </CardContent>
      </Card>
    </div>
  );
};

export default BoardingPassValidator;