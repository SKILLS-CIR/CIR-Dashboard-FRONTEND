# CocoByte User Documentation

## Introduction

CocoByte is a comprehensive web application designed to manage participants and activities for the ICPC Amrita Regionals contest. The platform provides role-based access to participants and administrators, streamlining registration, information management, and communication.

## Key Features

- Role-based dashboards (Participant & Admin)
- User management with site verification
- Real-time notifications system
- Contest information portal
- System activity logging
- WiFi credentials management

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Valid email address for registration

### Accessing the Application

1. Navigate to the Login Page  
   Visit: `https://your-domain.com/login`  
   You'll see the Amrita logo and login form.

2. Login Credentials  
   - Email: Your registered email address  
   - Password: Provided by administrators  
   - Role Selection: Choose your role (Participant or Admin)

3. First-Time Login  
   - You'll be redirected to your role-specific dashboard.  
   - Change your password in the profile section (recommended).

## User Roles

1. **Participant**  
   Participants are contest registrants who can:  
   - View their profile and contest information  
   - Access hostel and WiFi details  
   - Receive targeted notifications  
   - View campus maps for their site location

2. **Admin**  
   Administrators have full system access to:  
   - Manage all users (create, edit, delete)  
   - Send system-wide notifications  
   - View system logs and analytics  
   - Manage participant site assignments

3. **Super Admin**  
   Super Admins have additional privileges:  
   - Manage other admin accounts  
   - Access all administrative functions  
   - Override site verification restrictions

## Features by Role

### Participant Dashboard

**Navigation Menu**  
- Dashboard: Overview of your information  
- Profile: View detailed personal information  
- Contest Info: Contest rules and schedule  
- Notifications: View important updates  

**Dashboard Overview**  
Located at `/participant`  
Displays:  
- Personal information card (name, email, UID)  
- College and site location  
- Team assignment  
- Hostel details (name, room number)  
- WiFi credentials (username and password)  
- Site-specific campus map  
- Quick actions (View Profile, Contest Info)  

**Profile Page**  
Located at `/participant/profile`  
Features:  
- Complete personal information  
- Contact details  
- Team information  
- Hostel accommodation details  
- WiFi credentials with copy functionality  
- Google Maps location link  

**Contest Information**  
Located at `/participant/contest_info`  
Provides:  
- Contest statistics (active, upcoming, completed)  
- Contest rules and regulations  
- Important dates and schedules  
- Participation guidelines  
- Registration steps  

**Notifications**  
Located at `/participant/notification`  
Features:  
- Real-time notification feed  
- Filter by type (INFO, WARNING, ERROR, etc.)  
- Filter by priority (LOW, NORMAL, HIGH, URGENT)  
- Mark notifications as read  
- Action buttons for important updates  

### Admin Dashboard

**Navigation Menu**  
- Dashboard: System overview and analytics  
- Users: User management interface  
- System Logs: Activity monitoring  
- Notifications: Create and manage notifications  
- Profile: Admin account settings  

**Main Dashboard**  
Located at `/admin`  
- **Statistics Cards**: Total users count, Total login attempts, Successful logins, Participants count, Administrators count  
- **Analytics Charts**:  
  - User role distribution (pie chart)  
  - Site distribution (pie chart)  
  - Team distribution (pie chart)  
  - Login success/failure rates  
  - Device distribution  
  - Browser usage statistics  
  - Geographic login locations  

**User Management**  
Located at `/admin/users`  
Features:  
- **User List View**  
  - Desktop: Table view with sortable columns  
  - Mobile: Card-based responsive layout  
  - Pagination (10 users per page)  
  - Real-time search  
- **Search and Filters**  
  - Search by: name, email, UID, college  
  - Filter by: site location  
  - Filter by: team name  
  - Clear all filters option  
- **User Actions**  
  - View Details: See complete user profile  
  - Edit User: Modify user information  
  - Delete User: Remove user from system  
- **Bulk Operations**  
  - Bulk Import: Upload CSV file with multiple users  
  - Download Template: Get CSV format example  
  - Password Generation: Automatic secure passwords  

**User Detail Page**  
Located at `/admin/users/[id]/page.tsx`  
Shows complete user information:  
- Account details (email, UID, role)  
- Personal information  
- Site and team assignment (for participants)  
- Hostel information (for participants)  
- WiFi credentials (for participants)  
- Account creation date  
- Edit and delete options  

**Notification Management**  

**Create Notifications**  
Located at `/admin/notifications`  
Form Fields:  
- Title: Notification headline (required)  
- Message: Detailed notification content (required)  
- Type: INFO, SUCCESS, WARNING, ERROR, SYSTEM, ANNOUNCEMENT, CONTEST  
- Priority: LOW, NORMAL, HIGH, URGENT  
- Target Role: ALL, ADMIN, PARTICIPANT  
- Target Site: ALL, Amritapuri, Mysuru, Coimbatore, Bangalore  
- Action URL: Optional link for user action  
- Broadcast: Send to all users or targeted group  

**Manage Notifications**  
Located at `/admin/notifications/manage`  
Features:  
- View all system notifications  
- Filter by type, priority, and site  
- Search notifications  
- Edit existing notifications  
- Delete notifications  
- Statistics dashboard (total, broadcast, high priority, active)  

**System Logs**  
Located at `/admin/logs`  
Displays:  
- Login activity logs  
- User actions tracking  
- IP addresses and locations  
- Device and browser information  
- Operating system details  
- Timestamp information  
- Success/failure status  
- Expandable detailed view  

## Common Tasks

### For Participants

1. **View Your Information**  
   - Login to your account  
   - Navigate to Dashboard or Profile  
   - Review your details: Personal information, Site assignment, Team name, Hostel details, WiFi credentials  

2. **Copy WiFi Credentials**  
   - Go to Dashboard or Profile  
   - Find the WiFi Credentials section  
   - Click the copy icon next to username/password  
   - Paste credentials in WiFi settings  

3. **View Campus Map**  
   - Go to Dashboard  
   - Scroll to the Campus Map section  
   - View your site-specific map  
   - Use for navigation on campus  

4. **Check Notifications**  
   - Click Notifications in the menu  
   - View unread notifications (highlighted)  
   - Filter by type or priority if needed  
   - Click on notification for details  
   - Mark as read or take action  

### For Administrators

1. **Create a New User**  
   - **Single User Creation**:  
     - Navigate to Users page  
     - Click Create User button  
     - Fill in the user form:  
       - Basic Information: Name, email, gender  
       - Account Details: Password, UID (optional)  
       - Role Selection: PARTICIPANT or ADMIN  
       - Participant Details (if applicable): College name, Site location (cannot be changed later), Team name, Hostel information, WiFi credentials, Contact number  
     - Click Create User  
     - User receives credentials via email  
   - **Important Notes**:  
     - Email addresses must be unique  
     - Site name is locked after first assignment  
     - Only Super Admins can create/manage Admin users  

2. **Bulk Import Users**  
   - Click Users → Bulk Import  
   - Download the CSV template  
   - Fill in user data: `name,email,college,siteName,teamName,hostelName,roomNumber,wifiusername,wifiPassword,hostelLocation,contactNumber,gender`  
     Example row:  
     `John Doe,john@example.com,MIT,Amritapuri,Alpha,Hostel A,101,wifi_john,pass123,https://maps.google.com,1234567890,male`  
   - Upload the completed CSV file  
   - Review the import results  
   - Download credentials immediately (cannot be recovered later)  
   - Distribute credentials to users securely  
   - **CSV Template Fields**:  
     - Required: name, email, college  
     - Optional: siteName, teamName, hostel details  
     - Auto-generated: passwords, UIDs  

3. **Edit User Information**  
   - **Regular Participants**:  
     - Go to Users page  
     - Find the user (use search if needed)  
     - Click Actions → Edit User  
     - Modify information  
     - Click Save Changes  
   - **Participants with Site Assignment**:  
     - Find and click Edit User  
     - Modify allowed fields (name, contact, etc.)  
     - Site Verification Required: System displays site verification dialog  
     - Select the participant's registered site (Must match exactly to proceed)  
     - Confirm and save changes  
   - **Important**: Site name cannot be changed after initial assignment. Site verification protects against accidental changes. Email addresses cannot be modified.  

4. **Update User Password**  
   - Edit the user  
   - Scroll to Password Update section  
   - Enter new password (minimum 6 characters)  
   - Save changes  
   - Notify user of password change  

5. **Delete a User**  
   - Permissions: Only Super Admins can delete users. Cannot delete other Super Admin accounts. Cannot delete your own account.  
   - Steps:  
     - Go to Users page  
     - Find the user  
     - Click Actions → Delete User  
     - Confirm deletion in the dialog  
   - User data is permanently removed.  

6. **Send Notifications**  
   - **Broadcast to All**:  
     - Navigate to Notifications → Create Notification  
     - Enter title and message  
     - Select type and priority  
     - Set Target Role to "ALL"  
     - Set Target Site to "ALL"  
     - Click Send Notification  
   - **Targeted Notifications**:  
     - Create notification as above  
     - Target by Role: Select specific role (ADMIN or PARTICIPANT)  
     - Target by Site: Select specific site location  
     - Both: Combines role and site filters  
     - Send notification  
   - **Example Use Cases**:  
     - Site-specific: "Mysuru participants - Hostel check-in at 2 PM"  
     - Role-specific: "All admins - System maintenance tonight"  
     - High priority: Contest schedule changes  
     - With action URL: Link to registration form  

7. **Manage Existing Notifications**  
   - Go to Notifications → Manage Notifications  
   - View Statistics: Total, broadcast, high priority, active  
   - Filter notifications: By type, priority, or site  
   - Search: Find specific notifications  
   - Edit: Click edit icon → Modify → Save  
   - Delete: Click delete icon → Confirm  

8. **View System Logs**  
   - Navigate to System Logs  
   - Review login activity  
   - Filter by: Date range, Activity type (SUCCESS/FAILED), User email  
   - Expand rows for detailed information: IP address and location, Device and browser details, Operating system, Full user agent string  

## Site Verification System

### Why Site Verification?

The site verification system protects participant data integrity by:  
- Preventing accidental site changes  
- Requiring explicit confirmation for updates  
- Maintaining accurate site assignments  
- Ensuring data consistency  

### How It Works

- **Initial Assignment**: Admin assigns site when creating participant. Site name is immediately locked.  
- **Editing Protected Participants**: Admin attempts to edit participant details. System detects locked site. Verification dialog appears.  
- **Verification Process**: Dialog shows current site assignment. Admin selects site from dropdown. Selection must match registered site. Update proceeds only if match is verified.  
- **Error Handling**: Wrong site selection shows clear error. Must select correct site to proceed. Can cancel and retry.  

### Best Practices

- Always verify site information before confirming  
- Double-check participant records if unsure  
- Contact participant to confirm if needed  
- Document site assignments for reference  

## User Interface Features

### Responsive Design

- **Desktop**: Full sidebar navigation, table views  
- **Tablet**: Collapsible sidebar, adaptive layouts  
- **Mobile**: Bottom sheet navigation, card-based views  

### Dark Mode Support

- System automatically detects theme preference  
- Consistent colors across light/dark themes  
- Accessible contrast ratios  

### Search Functionality

- **Command Palette**: Press Ctrl+K (Windows) or Cmd+K (Mac)  
  - Quick navigation to any page  
  - Search across navigation items  
  - Fast access to common actions  

### Keyboard Shortcuts

- Ctrl/Cmd + K: Open command palette  
- Esc: Close dialogs/sheets  
- Enter: Submit forms  
- Tab navigation for accessibility  

## Security Features

### Password Security

- Minimum 6 characters required  
- Passwords hashed with bcrypt  
- Secure random password generation for bulk imports  
- Password visibility toggle  

### Session Management

- Automatic session timeout  
- Secure cookie storage  
- Protected API routes  
- Role-based access control  

### Data Protection

- Site assignment locking  
- Email uniqueness validation  
- Super Admin restrictions  
- Audit logging for all actions  

## Troubleshooting

### Login Issues

**Problem: Cannot log in**  
**Solutions**:  
- Verify email address is correct  
- Check password (case-sensitive)  
- Ensure correct role is selected  
- Clear browser cache and cookies  
- Try incognito/private mode  
- Contact administrator for password reset  

**Problem: "Unauthorized" error**  
**Solutions**:  
- Verify your account is active  
- Check assigned role matches login selection  
- Contact admin to verify account status  

### User Management Issues

**Problem: Cannot create user**  
**Solutions**:  
- Check email is unique (not already registered)  
- Verify all required fields are filled  
- For participants: ensure college name is provided  
- Check password meets minimum length (6 characters)  

**Problem: Cannot edit participant site**  
**Solutions**:  
- This is by design - sites cannot be changed  
- Site verification protects data integrity  
- Contact Super Admin if site must change  
- May require creating new account  

**Problem: Bulk import fails**  
**Solutions**:  
- Download and use the provided CSV template  
- Verify CSV format matches template exactly  
- Check for duplicate email addresses  
- Ensure required fields are not empty  
- Remove any special characters from data  
- Save file as CSV (not Excel format)  

### Notification Issues

**Problem: Notifications not sending**  
**Solutions**:  
- Verify title and message are not empty  
- Check target role/site selection  
- Ensure action URL is valid (if provided)  
- Review system logs for errors  

**Problem: Cannot delete notification**  
**Solutions**:  
- Only admins can delete notifications  
- Refresh page and try again  
- Check internet connection  

### Display Issues

**Problem: Layout looks broken**  
**Solutions**:  
- Clear browser cache  
- Update to latest browser version  
- Try different browser  
- Check screen zoom level (should be 100%)  
- Disable browser extensions temporarily  

**Problem: Mobile menu not working**  
**Solutions**:  
- Tap menu icon (three lines) at top left  
- Try landscape orientation  
- Refresh the page  
- Clear app data if using PWA  

## Best Practices

### For Participants

- **Keep Credentials Safe**: Don't share WiFi passwords. Change password after first login. Log out when using shared devices.  
- **Check Notifications Regularly**: Important updates sent via notifications. Enable browser notifications if available. Check dashboard for unread count.  
- **Verify Information**: Review profile details for accuracy. Report incorrect information to admin. Keep contact number updated.  

### For Administrators

- **User Management**: Use bulk import for multiple users. Download credentials immediately after import. Distribute credentials securely (email individually). Verify site assignments before confirming. Keep user records organized.  
- **Notification Strategy**: Use appropriate priority levels. Target specific audiences when possible. Keep messages clear and concise. Include action URLs when relevant. Test notifications before mass sending.  
- **Security**: Review system logs regularly. Monitor failed login attempts. Update user access as needed. Follow data protection guidelines. Report suspicious activity.  
- **Maintenance**: Regular data backups. Periodic user list review. Clean up inactive accounts. Archive old notifications.  

## API Endpoints Reference

### User Management

- `GET /api/users` - Fetch all users  
- `POST /api/users` - Create new user  
- `PATCH /api/users?userId={id}` - Update user  
- `DELETE /api/users?id={id}` - Delete user  
- `GET /api/users/{id}` - Get user details  
- `POST /api/users/bulk-import` - Bulk import users  

### Notifications

- `GET /api/notifications` - Get user notifications  
- `POST /api/notifications` - Create notification  
- `PATCH /api/notifications?id={id}` - Update notification  
- `DELETE /api/notifications?id={id}` - Delete notification  
- `GET /api/notifications/admin` - Get all notifications (admin)  
- `POST /api/notifications/{id}/read` - Mark as read  

### System Logs

- `GET /api/logs` - Get activity logs  
- `GET /api/logs?startDate={date}&endDate={date}` - Filter logs  

---

*Last updated: December 06, 2025*
