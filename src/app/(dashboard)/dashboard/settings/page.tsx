"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Save, AlertCircle, MessageCircle, CheckCircle, XCircle, Loader2, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vendorId: string;
  // Business info
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Bank info
  bankName?: string;
  bankRouting?: string;
  bankAccount?: string;
  accountingNotes?: string;
  // Discord
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  isExclusiveMember?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Handle Discord OAuth result from URL params
    const discordResult = searchParams.get("discord");
    const discordError = searchParams.get("error");
    
    if (discordResult === "linked") {
      toast({
        title: "Discord Linked!",
        description: "Your Discord account has been connected successfully.",
      });
      // Clean URL
      router.replace("/dashboard/settings");
    } else if (discordError) {
      let errorMessage = "Failed to link Discord account. Please try again.";
      
      if (discordError === "discord_denied") {
        errorMessage = "You cancelled the Discord authorization.";
      } else if (discordError === "discord_already_linked") {
        errorMessage = "This Discord account is already linked to another account.";
      }
      
      toast({
        title: "Discord Link Failed",
        description: errorMessage,
        variant: "destructive",
      });
      router.replace("/dashboard/settings");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setError("Failed to load profile");
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        setError("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsProfileLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      companyName: formData.get("companyName") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
      bankName: formData.get("bankName") as string,
      bankRouting: formData.get("bankRouting") as string,
      bankAccount: formData.get("bankAccount") as string,
      accountingNotes: formData.get("accountingNotes") as string,
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to update profile");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPasswordLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      setIsPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      setIsPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function handleLinkDiscord() {
    setIsDiscordLoading(true);
    // Redirect to our custom Discord OAuth endpoint
    window.location.href = '/api/auth/discord';
  }

  async function handleUnlinkDiscord() {
    setIsDiscordLoading(true);
    
    try {
      // Call API to unlink Discord
      const response = await fetch("/api/profile/discord", {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        setUser(user ? { ...user, discordId: undefined, discordUsername: undefined, isExclusiveMember: false } : null);
        toast({
          title: "Discord unlinked",
          description: "Your Discord account has been disconnected.",
        });
      } else {
        throw new Error("Failed to unlink");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unlink Discord account",
        variant: "destructive",
      });
    } finally {
      setIsDiscordLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error || "Failed to load profile"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Vendor ID Display */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Your Vendor ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-queens-purple">{user.vendorId}</p>
            <p className="text-sm text-slate-500 mt-1">Use this ID when communicating with the admin</p>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-queens-purple/10 flex items-center justify-center">
                <User className="w-5 h-5 text-queens-purple" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={user.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={user.lastName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Contact support to change your email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Business Info */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Business Information (Optional)</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      defaultValue={user.companyName || ""}
                      placeholder="Your business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={user.address || ""}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={user.city || ""}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        defaultValue={user.state || ""}
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        defaultValue={user.zipCode || ""}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Payment Information (Optional)</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">Used for ACH payments. This information is kept secure and only visible to admins.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      defaultValue={user.bankName || ""}
                      placeholder="Chase, Bank of America, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankRouting">Routing Number</Label>
                      <Input
                        id="bankRouting"
                        name="bankRouting"
                        defaultValue={user.bankRouting || ""}
                        placeholder="9 digits"
                        maxLength={9}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Account Number</Label>
                      <Input
                        id="bankAccount"
                        name="bankAccount"
                        defaultValue={user.bankAccount || ""}
                        placeholder="Account number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountingNotes">Accounting Notes</Label>
                    <Input
                      id="accountingNotes"
                      name="accountingNotes"
                      defaultValue={user.accountingNotes || ""}
                      placeholder="Any special payment instructions..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isProfileLoading}>
                  {isProfileLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-queens-purple/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-queens-purple" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-slate-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={isPasswordLoading}>
                  {isPasswordLoading && (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Discord Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Discord Integration</CardTitle>
                <CardDescription>Link your Discord for exclusive member pricing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user?.discordId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
                  {user.discordAvatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                      alt="Discord avatar"
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.discordUsername || 'Discord User'}</p>
                    <p className="text-sm text-slate-500">Connected</p>
                  </div>
                  {user.isExclusiveMember ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Exclusive Member
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                      <XCircle className="w-4 h-4" />
                      Not in Partner Server
                    </div>
                  )}
                </div>
                
                {!user.isExclusiveMember && (
                  <p className="text-sm text-slate-500">
                    Join one of our partner Discord servers to unlock exclusive pricing on deals.
                  </p>
                )}
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUnlinkDiscord}
                    disabled={isDiscordLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDiscordLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Unlink Discord
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Connect your Discord account to access exclusive member pricing. 
                  You must be a member of one of our partner Discord servers to unlock exclusive deals.
                </p>
                
                <Button
                  type="button"
                  onClick={handleLinkDiscord}
                  disabled={isDiscordLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isDiscordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4 mr-2" />
                  )}
                  Link Discord Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
