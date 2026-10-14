# WhiteCoats scenarios

Site: `https://myappointments.whitecoats.com`

These scenarios describe how a person uses the WhiteCoats portal. **Automated** scenarios are implemented in `tests/public` and are safe to run against the public site. **Sandbox** scenarios need a hospital tenant created for testing. Do not run them against a hospital that holds real patient records.

Roles and where each one lands after a successful sign-in:

| Role | Sign-in | Home |
| --- | --- | --- |
| Patient | `/login/patient` (mobile OTP) | `/patient/dashboard` |
| Staff | `/login/staff` (hospital, then email) | `/staff/dashboard` |
| Doctor | `/login/doctor` (hospital, then email) | `/doctor/dashboard` |
| Branch admin | `/login/branch-admin` (hospital, then email) | `/branch-admin/dashboard` |
| Hospital admin | `/login/hospital-admin` | `/hospital-admin/dashboard` |
| Sales | `/login/sales` (direct URL, not in the public menu) | `/sales/dashboard` |
| Super admin | `/login/super-admin` | `/super-admin/dashboard` |

`/login` itself redirects to the marketing home. The public **Sign In** menu ("Select Your Portal") offers Super Admin, Hospital Admin, Branch Admin, Doctor, Staff, and Patient. Sales is not in that menu.

## Marketing

### WC-MKT-01 Home page introduces the platform

**Automated.** `tests/public/marketing.spec.ts`

- **Given** a visitor opens `/`
- **Then** the title is "WhiteCoats | Healthcare Management Platform"
- **And** the hero reads "Modern Healthcare Management Platform"
- **And** the page shows the trust line "Trusted by 500+ Healthcare Providers"
- **And** the stats read 500+ Hospitals, 2M+ Patients Served, 15K+ Doctors, and 99.9% Uptime
- **And** testimonials name Dr. Rajesh Kumar, Dr. Priya Sharma, and Amit Patel
- **And** the closing band reads "Ready to Transform Your Hospital?"
- **And** the footer copyright is "© 2024 WhiteCoats Healthcare Solutions. All rights reserved."

### WC-MKT-02 Product areas are listed

**Automated.**

- **Given** the home page
- **Then** "Everything You Need to Run Your Hospital" lists Smart Appointments, Electronic Medical Records, Telemedicine, Analytics & Insights, Billing & Payments, and Lab & Pharmacy, each with its description

### WC-MKT-03 Header links scroll to the matching section

**Automated.**

- **When** the visitor chooses Features
- **Then** `#features` is in view
- **When** the visitor chooses Testimonials
- **Then** `#testimonials` is in view

### WC-MKT-04 Footer groups the site map

**Automated.**

- **Then** the footer has Product, Company, and Support columns
- **And** the links are Features, Pricing, Integrations, Security, About Us, Careers, Blog, Contact, Help Center, Documentation, Training, and System Status

### WC-MKT-05 Unknown paths show not found

**Automated.**

- **When** a visitor opens a path the app does not define
- **Then** the page reads "404 - Page Not Found"

### WC-MKT-06 Trial and demo entry points are present

**Automated.**

- **Then** Start Free Trial, Watch Demo, and Schedule a Demo are visible
- **When** the visitor chooses Start Free Trial
- **Then** the app routes through `/login`, which returns to the marketing home
- **And** the working sign-in entry is the Sign In portal menu, not Start Free Trial

### WC-MKT-07 Phone navigation

**Automated.** Viewport 390×844.

- **Given** a phone-width window
- **Then** the desktop Features link and header Sign In button are hidden
- **When** the visitor opens "Toggle menu"
- **Then** Features, Testimonials, and Sign In are in the menu
- **When** the visitor chooses Features
- **Then** the features section is in view and the menu closes

### WC-MKT-08 Legal pages linked from signup

**Sandbox / product gap.** Not locked into the public suite.

- **Given** the patient consent step
- **Then** Terms of Service points at `/terms` and Privacy Policy points at `/privacy`
- **Expected product result** each link opens the policy
- **Observed** those paths are not registered, so the app renders "404 - Page Not Found"

## Sign-in shells

### WC-AUTH-01 Portal menu lists every role

**Automated.**

- **When** the visitor opens Sign In on the home page
- **Then** the menu title is "Select Your Portal"
- **And** the choices are Super Admin, Hospital Admin, Branch Admin, Doctor, Staff, and Patient
- **And** Patient is described as "Book appointments & view records"
- **And** Sales is not in this menu

### WC-AUTH-02 Email portals show the credential form

**Automated** for Super Admin and Hospital Admin from the menu, and for Sales by opening `/login/sales` directly.

- **When** the visitor picks Super Admin or Hospital Admin, or opens the sales URL
- **Then** the URL is `/login/super-admin`, `/login/hospital-admin`, or `/login/sales`
- **And** the headings are "Super Admin Portal", "Hospital Admin Portal", or "Sales Portal"
- **And** the form has email, password, Remember me, Forgot password?, and Sign In

### WC-AUTH-03 Hospital-scoped roles search for a hospital first

**Automated** for Branch Admin, Doctor, and Staff.

- **When** the visitor opens that portal
- **Then** the heading is "Find your hospital"
- **And** the subtitle names the role ("signing in as Branch Admin", "Doctor", or "Staff")
- **When** they type a name that is not in the directory
- **Then** the page reads `No hospitals found matching "<query>".`
- **And** the email field is not shown until a hospital is chosen
- **When** they choose a hospital
- **Then** the credential form for that portal appears, and Back clears the hospital

### WC-AUTH-04 A bad email is rejected in the browser

**Automated.**

- **Given** the hospital admin form
- **When** email is left empty and the field blurs
- **Then** the message is "Email is required"
- **When** the email is `not-an-email`
- **Then** the message is "Please enter a valid email address"
- **And** Sign In stays on `/login/hospital-admin`
- **And** no login request is sent

### WC-AUTH-05 Password visibility toggles

**Automated.**

- **Given** a password typed into the super admin form
- **Then** the field is masked
- **When** the visitor chooses Show password
- **Then** the field is readable
- **When** they choose Hide password
- **Then** the field is masked again

### WC-AUTH-06 Back leaves the portal

**Automated.**

- **Given** the sales portal
- **When** the visitor chooses Back
- **Then** the marketing home is shown

### WC-AUTH-07 Forgot password requires an email

**Automated.**

- **Given** Forgot password? on a portal
- **Then** the page is `/forgot-password` and the heading is "Forgot Password"
- **When** Send Reset Instructions is used with an empty email
- **Then** the message is "Please enter your email address"
- **And** no reset email is requested
- **When** a real account email is submitted on a sandbox
- **Then** the page says to check that inbox, including when no account exists, and offers a return to sign-in

### WC-AUTH-08 Reset password without a token

**Automated.**

- **Given** `/reset-password` with no token
- **Then** the heading is "Invalid Reset Link"
- **And** the page reads "This password reset link is invalid or has expired. Please request a new password reset."
- **When** Request New Reset Link is chosen
- **Then** `/forgot-password` opens
- **And** no reset request is sent

### WC-AUTH-09 Short entry URLs

**Automated.**

- **When** a visitor opens `/login`
- **Then** they land on the marketing home
- **When** a visitor opens `/register`
- **Then** they land on `/signup`

### WC-AUTH-10 Successful staff, doctor, or branch sign-in

**Sandbox.**

- **Given** a hospital chosen on the finder
- **And** an active user for that role at that hospital
- **When** they submit the correct email and password
- **Then** they land on that role's dashboard
- **When** the password is wrong
- **Then** the form shows the server error and stays on the portal
- **When** the account is already signed in on another device
- **Then** a dialog titled "Already Logged In" offers Cancel and "Yes, Logout & Continue"
- **When** they continue
- **Then** the other session ends and this one opens the dashboard
- **When** the account must change its password (first login, expiry, or a forced change)
- **Then** the change dialog requires 8 characters, an uppercase letter, a lowercase letter, a number, and a special character
- **And** a mismatched confirmation reads "Passwords do not match"
- **And** the dashboard opens only after the change succeeds

### WC-AUTH-11 Wrong role for a portal

**Sandbox.**

- **Given** a doctor account used on the hospital admin portal
- **When** they submit correct credentials
- **Then** sign-in fails with "Access denied. Email or password is invalid."
- **And** they are not given the other role's dashboard

### WC-AUTH-12 Remember me

**Sandbox.**

- **When** a user signs in with Remember me checked
- **Then** a later visit to the same portal can restore the session
- **And** the password is not recoverable from browser storage

### WC-AUTH-13 Reset link happy path

**Sandbox.**

- **Given** a reset link with a valid token
- **Then** the form is titled "Reset Password" and asks for a new password and a confirmation
- **When** the confirmation differs
- **Then** the form reads "Passwords do not match"
- **When** the new password is under 6 characters
- **Then** the message is "Password must be at least 6 characters long"
- **When** it has no uppercase letter, lowercase letter, or number
- **Then** the form asks for all three
- **When** the rules pass and the confirmation matches
- **Then** the page reads "Password Reset Successful" and Go to Login returns through `/login` to the home page

### WC-AUTH-14 Logout

**Sandbox.**

- **Given** a signed-in session
- **When** the user chooses Logout
- **Then** protected pages are no longer available
- **And** opening a dashboard returns to the marketing home

## Patient

### WC-PAT-01 Mobile number gates Send OTP

**Automated.**

- **Given** the patient portal
- **Then** the heading is "Patient Login" and the helper is "Sign in with mobile number"
- **And** the country code is +91
- **And** Send OTP is disabled
- **When** 5 digits are entered
- **Then** Send OTP stays disabled
- **When** 10 digits are entered
- **Then** Send OTP becomes enabled
- **And** this scenario does not send the code
- **When** the visitor chooses Sign up
- **Then** `/signup?role=patient` opens "Create Your Patient Account"

### WC-PAT-02 Signup offers only a patient account

**Automated.**

- **Given** `/signup`
- **Then** the heading is "Welcome to WhiteCoats" and the subtitle is "Choose your account type to get started"
- **And** the only account type is "I'm a Patient"
- **When** they choose Sign in here
- **Then** they return to the marketing home

### WC-PAT-03 Hospital step blocks a blank choice

**Automated.**

- **Given** I'm a Patient
- **Then** the steps are Hospital, Personal Info, Verify Phone, and Consents
- **And** the step title is "Choose Your Hospital"
- **When** the search matches nothing
- **Then** the page reads "No hospitals match your search."
- **When** Next is used with no hospital selected
- **Then** the message is "Please select a hospital to continue"
- **And** the wizard stays on Hospital

### WC-PAT-04 Personal details are checked before a code is sent

**Automated** when at least one hospital is open for registration. Skipped when the directory is empty ("No hospitals are available for registration right now.").

- **Given** a hospital is selected and Next is used
- **Then** the step title is "Personal Information"
- **When** Next is used immediately
- **Then** the message is "Please enter your first name"
- **When** the first name is one character
- **Then** the message is "First name must be at least 2 characters"
- **When** the last name is one character
- **Then** the message is "Last name must be at least 2 characters"
- **When** the optional email is `not-an-email`
- **Then** the message is "Please enter a valid email address (e.g., example@domain.com)"
- **When** the email is cleared and the phone is empty
- **Then** the message is "Please enter a valid 10-digit phone number"
- **And** Verify Phone is not shown

### WC-PAT-05 Register an adult patient

**Sandbox.** Do not complete this on the public site.

- **Given** a hospital selected on step 1
- **And** first name, last name, a valid optional email, a 10-digit mobile number, a date of birth in the past and within 150 years, and a gender (Male, Female, or Other)
- **When** Next is used
- **Then** a 6-digit code is sent to that mobile number
- **When** the code is entered
- **Then** the page reads "Phone number verified successfully!" and moves to Consents
- **When** Create Account is used without Terms of Service and Privacy Policy
- **Then** the message is "You must agree to the Terms of Service and Privacy Policy to continue"
- **When** both required consents are accepted
- **Then** the account is created and the app opens `/patient/dashboard` as a new user

### WC-PAT-06 Register a patient under 18

**Sandbox.**

- **Given** a date of birth that makes the patient younger than 18
- **Then** the form asks for guardian name, guardian phone, and relationship (Parent, Mother, Father, Legal Guardian, or Grandparent)
- **When** any guardian field is missing
- **Then** registration stays on Personal Info
- **When** consents are submitted without guardian consent
- **Then** the message is "Guardian consent is mandatory for patients under 18"

### WC-PAT-07 Rejected personal details

**Sandbox.**

- **When** the date of birth is in the future
- **Then** the message is "Date of birth cannot be in the future"
- **When** the date of birth is more than 150 years ago
- **Then** the message is "Please enter a valid date of birth"
- **When** gender is not selected
- **Then** the message is "Please select your gender"
- **When** Verify Phone is continued before the code succeeds
- **Then** the message is "Please verify your phone number to continue"

### WC-PAT-08 Patient sign-in with a code

**Sandbox.**

- **Given** a registered mobile number
- **When** Send OTP is used
- **Then** six single-digit boxes appear for "+91" plus that number
- **And** Verify & Login stays disabled until every box has a digit
- **When** the code is correct
- **Then** the patient dashboard opens
- **When** the code is wrong
- **Then** the boxes show an error and the dashboard does not open
- **When** Change is used
- **Then** the mobile field is editable again
- **When** the resend timer is running
- **Then** the control reads "Resend OTP in Ns" and cannot be used yet

### WC-PAT-09 Several hospitals on one patient

**Sandbox.**

- **Given** a patient with profiles at more than one hospital and none selected
- **When** they open the portal
- **Then** `/select-hospital` reads "Select a hospital to continue"
- **When** they choose a hospital
- **Then** the dashboard and later booking use that hospital

### WC-PAT-10 Book an in-person visit

**Sandbox.**

- **Given** a signed-in patient
- **When** they choose Book Appointment (dashboard, My Appointments, or an empty upcoming list)
- **Then** `/patient/appointments/specializations` asks "What type of care do you need?"
- **When** they select one or more specializations and continue
- **Then** they choose a branch, department, doctor, date, and time
- **And** a missing branch reads "Please select a branch"
- **And** a missing department, doctor, date, or time reads "Please fill in all required fields"
- **When** the doctor accepts in-person visits
- **Then** the appointment type can be In-Person
- **When** they book for themselves, enter a reason of at least 10 characters, and confirm
- **Then** the visit appears under Upcoming
- **When** the slot was just taken
- **Then** the message is "This time slot has just been booked. Please select a different time slot."
- **When** the chosen time today is already past
- **Then** that slot cannot be confirmed

### WC-PAT-11 Book a video visit

**Sandbox.**

- **Given** a doctor who accepts video consultations
- **When** the patient chooses Video and confirms a slot
- **Then** the upcoming card shows "Video Consultation"
- **And** the visit can be opened from the video-call entry for that appointment
- **Given** a doctor who does not accept video
- **Then** Video is not offered for that doctor

### WC-PAT-VIDEO Book a video visit with Dr Amithaa Sai

**Headed Playwright.** `tests/auth/patient-video-booking.spec.ts`. Skipped unless `WC_PATIENT_OTP` or `WC_PATIENT_SESSION_FILE` is set. The default host is `https://myappointments.whitecoats.com`. Razorpay on that host is live, so the script opens checkout and stops. It never types a card, UPI id, or any other payment, and the visit stays unconfirmed until the ₹1 is paid.

- **Given** mobile `7893934952` on `/login/patient`
- **When** `WC_PATIENT_OTP` holds the six-digit code for a fresh SMS login
- **Then** the script presses Send OTP and submits that code
- **When** `WC_PATIENT_SESSION_FILE` points at a local JSON session already verified for that number
- **Then** the script restores the session and does not request a new SMS
- **And** the code, the session file, and any password stay off the git tree
- **When** the patient continues
- **Then** they select Ayuman Hospitals and land on the patient dashboard
- **And** they search Dermatology and open Dr Amithaa Sai (the name on the site)
- **And** the visit type is Video Consultation for ₹1
- **And** the reason is "Video dermatology consultation for a skin review"
- **And** the script takes the first open afternoon slot from 4:00 PM through 8:00 PM
- **And** the headed run on 14 October 2026 selected Wednesday 14 October 2026 at 4:00 PM
- **When** Pay & Book is used
- **Then** the live Razorpay window opens for ₹1, showing UPI, card, netbanking, and wallet
- **And** the script leaves that window untouched

### WC-PAT-12 Book for a family member

**Sandbox.**

- **Given** at least one family member on `/patient/family-members`
- **When** the patient sets the visit to a family member
- **Then** Select Family Member is required
- **And** the member's name and relationship are shown in the list
- **When** the visit is confirmed
- **Then** the appointment is stored for that member, and it appears in the member's appointment list

### WC-PAT-13 Empty appointment lists

**Sandbox.**

- **Given** a patient with no upcoming visits
- **Then** My Appointments reads "No Upcoming Appointments" and offers "Book an Appointment"
- **Given** no past visits
- **Then** history offers a way to book the first appointment

### WC-PAT-14 Cancel and reschedule

**Sandbox.**

- **Given** an upcoming visit that the hospital still allows to change
- **When** the patient cancels and gives a reason
- **Then** the visit leaves Upcoming and the status is cancelled
- **When** they reschedule to an open slot
- **Then** the new date and time replace the old ones
- **And** a taken slot shows the same slot-unavailable message as booking

### WC-PAT-15 Records, prescriptions, labs, and billing

**Sandbox.**

- **Given** a patient with completed visits
- **Then** Medical Records, Health Summary, Visit History, and Documents open from the records menu
- **And** Prescriptions lists medications from those visits, and a prescription can be opened
- **And** Lab Reports lists results the hospital has released
- **And** Billing, Payment History, and Refunds show invoices, payments, and any refund tied to those visits
- **Given** a new patient with none of these
- **Then** each screen shows its empty state rather than an error

### WC-PAT-16 Profile, reviews, messages, and support

**Sandbox.**

- **When** the patient updates profile details and saves
- **Then** a reload shows the new details
- **When** they submit a doctor review after a completed visit
- **Then** the review is listed under Doctor Reviews
- **When** they open a support ticket from Support & Help
- **Then** the ticket appears under My Tickets with the text they entered

## Staff

Staff sign-in is WC-AUTH-03 plus WC-AUTH-10. After sign-in the menu includes Check-In, Appointments (today, book, reschedule, cancel, follow-ups), Patients (register and search), Billing, Insurance, and Support.

### WC-STF-01 Today's board and check-in

**Sandbox.**

- **Given** appointments booked for today at this branch
- **When** staff open `/staff/appointments/today` and `/staff/check-in`
- **Then** those patients are listed
- **When** staff check a patient in
- **Then** that visit shows as checked in
- **And** checking in the same visit again does not create a second check-in

### WC-STF-02 Register a patient

**Sandbox.** `/staff/patients/new`

- **When** required identity fields are missing
- **Then** the form explains what is missing and does not save
- **When** the required fields are valid, including a unique mobile number
- **Then** the patient can be found from `/staff/patients/search`
- **When** the same mobile number is registered again
- **Then** the form reports the duplicate and does not create a second chart

### WC-STF-03 Book, reschedule, cancel, and follow up

**Sandbox.**

- **Given** `/staff/appointments/new`
- **When** branch, department, doctor, date, or time is missing
- **Then** the form reads "Please select a branch" or "Please fill in all required fields"
- **When** the patient was referred by a doctor and the referring name or hospital is blank
- **Then** the form reads "Referring Doctor Name and Hospital Name are required when the patient is referred by a doctor"
- **When** a valid in-person or video slot is confirmed
- **Then** the visit appears on today's board and on the patient's chart
- **When** staff reschedule it from `/staff/appointments/reschedule`
- **Then** the new slot replaces the old one
- **When** staff cancel it from `/staff/appointments/cancel` with a reason
- **Then** it drops off the active board
- **Then** follow-ups due are listed at `/staff/appointments/follow-ups`

### WC-STF-04 Vitals and billing

**Sandbox.**

- **Given** a checked-in visit
- **When** staff record vitals
- **Then** the doctor can see those vitals on the consultation
- **When** staff create an invoice at `/staff/billing/new`
- **Then** it appears under billing and, if unpaid, under Pending Payments
- **When** a payment is collected
- **Then** the balance updates
- **When** a refund is issued from `/staff/billing/refunds`
- **Then** the refund is visible to the patient under Refunds

## Doctor

Doctor sign-in is WC-AUTH-03 plus WC-AUTH-10.

### WC-DOC-01 The day list

**Sandbox.**

- **Given** today's appointments for this doctor
- **When** they open Today, Upcoming, and History
- **Then** each list matches that status
- **And** a video visit is distinguishable from an in-person visit

### WC-DOC-02 Consultation, notes, and prescription

**Sandbox.**

- **Given** a checked-in appointment
- **When** the doctor opens the consultation
- **Then** the patient's chart, vitals, and reason are available
- **When** they save notes and add a prescription
- **Then** the prescription appears under the doctor's prescriptions and on the patient's prescription list
- **When** they complete the visit
- **Then** it moves to History and no longer sits on Today as active

### WC-DOC-03 EMR case

**Sandbox.**

- **When** the doctor creates a case from `/doctor/emr/cases/new`
- **Then** it is listed under EMR Cases
- **When** they edit it
- **Then** the saved text is still there after a reload

### WC-DOC-04 Schedule and leave

**Sandbox.**

- **Given** the doctor's weekly schedule
- **When** they request leave for a future date
- **Then** the request is visible under Leave Requests
- **And** patients cannot book that date once the leave is approved
- **When** a slot is already booked
- **Then** the schedule still shows that appointment

### WC-DOC-05 Video consultation

**Sandbox.**

- **Given** a video appointment that is due
- **When** the doctor joins from the video-call entry
- **Then** the call screen opens for that appointment id
- **And** ending the call returns to the consultation so notes can be saved

## Branch admin

Sign-in is WC-AUTH-03 plus WC-AUTH-10. The menu covers departments, doctors, schedules, leave approvals, staff, patients, today's appointments, booking, billing, insurance, and daily, appointment, and revenue reports.

### WC-BRA-01 Book on behalf of a patient

**Sandbox.** `/branch-admin/appointments/new`

- **When** the same required fields as staff booking are missing
- **Then** the same branch, department, doctor, and slot messages appear
- **When** the booking is confirmed
- **Then** it is visible under Today for that branch and on the doctor's day list

### WC-BRA-02 Leave approval

**Sandbox.**

- **Given** a doctor leave request
- **When** the branch admin approves it
- **Then** the doctor's schedule shows the leave
- **And** the public slot list for that day no longer offers those times
- **When** they reject it
- **Then** the doctor's slots stay bookable

### WC-BRA-03 Daily report

**Sandbox.**

- **Given** a day with bookings, check-ins, and payments
- **When** the branch admin opens the daily summary and the appointment and revenue reports
- **Then** the counts match the appointments and invoices for that branch and day

## Hospital admin

Sign-in is the email form in WC-AUTH-02 and the success rules in WC-AUTH-10. There is no hospital search on this portal.

### WC-HOS-01 Hospital profile

**Sandbox.** `/hospital-admin/settings/profile`

- **Then** Hospital Code is visible and cannot be edited
- **When** the hospital name or contact details change and are saved
- **Then** a reload shows the new details
- **And** the code is unchanged

### WC-HOS-02 Branch, department, and doctor

**Sandbox.**

- **When** a branch is added
- **Then** it appears in the branch list and can be selected by staff at that hospital
- **When** a department and a doctor are added and given a schedule
- **Then** patients can book that doctor in that department
- **When** a required field is missing
- **Then** the form does not save

### WC-HOS-03 Billing reconciliation and refunds

**Sandbox.**

- **Given** invoices and payments across branches
- **When** the admin opens invoices, payments, and reconciliation
- **Then** totals match the branch invoices for the selected dates
- **When** a refund is approved
- **Then** it appears under refunds and on the patient's refund list

### WC-HOS-04 Insurance claim

**Sandbox.**

- **When** the admin starts a claim from `/hospital-admin/insurance/claims/new` with a patient, visit, and insurer
- **Then** the claim is listed and can be opened
- **When** a required field is missing
- **Then** the claim is not created

### WC-HOS-05 Reports

**Sandbox.**

- **When** the admin opens revenue, appointments, patients, and doctors reports for a date range
- **Then** each report is limited to that range and to this hospital
- **And** an export downloads a file for that same range

## Sales

Sign-in is the email form in WC-AUTH-02.

### WC-SAL-01 Add a lead and move it on the pipeline

**Sandbox.**

- **When** a lead is added at `/sales/leads/new` with a name and a way to contact them
- **Then** it appears under All Leads and My Leads
- **When** it is moved along the pipeline
- **Then** the pipeline column changes
- **When** required contact fields are empty
- **Then** the lead is not saved

### WC-SAL-02 Follow-ups and a booking for the lead

**Sandbox.**

- **Given** a follow-up due today
- **Then** it is listed under Follow-ups / Today
- **When** the date is in the past and it is still open
- **Then** it is listed under Overdue
- **When** sales book an appointment for the lead
- **Then** it appears under Upcoming and under Reminders
- **And** the patient-facing appointment exists only after the lead is tied to a real patient record

## Super admin

Sign-in is the email form in WC-AUTH-02. This role can see every tenant. Use a platform test account, not a hospital account.

### WC-SUP-LOGIN Super admin sign-in

**Automated** for `superadmin@whitecoats.com` when `WC_SUPER_ADMIN_PASSWORD` is set. Otherwise skipped.

- **Given** `/login/super-admin`
- **When** the super admin submits a valid email and password
- **And** an existing session asks "Already Logged In"
- **Then** "Yes, Logout & Continue" ends that other session
- **And** `/super-admin/dashboard` opens with the Dashboard heading, the Tenants menu, and the Super Administrator label
- **When** the door control is used and Logout is confirmed
- **Then** the session returns to the marketing home

### WC-SUP-E2E Super admin workspace walk

**Automated** for `superadmin@whitecoats.com` when `WC_SUPER_ADMIN_PASSWORD` is set. Read-only. It does not create a tenant, send a payment link, change a status, or save settings.

- **Given** a signed-in super admin on the dashboard
- **Then** Quick Actions and Key Performance Indicators are visible
- **When** each sidebar item is opened
- **Then** Dashboard, Tenants, Service Management, Subscription Plans, Billing & Payments (All Payments, Billing Summary Report), Proforma Invoice, Employee Management (All Users, Roles & Permissions, Departments), Analytics, System Health, Reports (Revenue Reports, Online Payments), Support & Helpdesk (Support Dashboard, Ticket Management), Documents (API URLs, User Manual), and System Settings (General, Email, Notifications, Security, Payment Gateway, SMS Template Tester, My Account) each load their own screen
- **And** none of those screens is the 404 page
- **When** the tenant search is a name that does not exist
- **Then** the known tenant row is hidden, and clearing the search shows it again
- **When** Add Tenant is opened
- **Then** Create with Payment Now and Generate Payment Link are offered, and dismissing the menu does not start either flow
- **When** the view control on the first tenant is used
- **Then** Tenant Details opens for that tenant and can be closed
- **When** the session signs out and `/super-admin/dashboard` is opened again
- **Then** the visitor is back on the marketing home

### WC-SUP-ADD Add Tenant form

**Automated** for `superadmin@whitecoats.com` when `WC_SUPER_ADMIN_PASSWORD` is set.

The Add Tenant menu has two choices. Create with Payment Now records a payment the platform has already received and creates the tenant. Generate Payment Link does not create the tenant until the hospital admin pays. These checks never generate a link, never pick a card, and never change an existing hospital.

Create with Payment Now fields:

- Tenant Information: Tenant Name, Subdomain (suffix `.whitecoats.com`)
- Contact and admin: Contact Name, Contact Email, Contact Phone, Admin Email, and a note that the admin password is generated and emailed
- Healthcare: Category, Bed Size, Stream of Practice, Type of Specialty, and an optional GST checkbox that reveals GST Number
- Subscription: Subscription Plan, Billing Cycle, then Price Summary with GST (18%), Total Amount, and Invoice Status
- Payment: Payment Method, Transaction ID (required unless the method is Cash), Payment Date, Next Due Date, Next Billing Date
- Location: Address, Country, State, City, Postal Code
- Branding: Primary Color, Secondary Color, defaulting to `#39c94c` and `#107fd6`
- Actions: Cancel and Create Tenant

- **When** Create Tenant is submitted empty
- **Then** the form stays open and reports that tenant name, subdomain, contact email, admin email, subscription plan, payment date, payment method, category, stream of practice, type of specialty, and contact phone are required
- **When** subdomain, emails, phone, postal code, GST number, or a non-cash payment without a transaction id are invalid
- **Then** each field reports its own format error and no tenant is created
- **When** the values are valid and the tenant `cursor-e2e` is not already present
- **Then** one clinic is created with Cash, the saved name Cursor E2e Clinic, and subdomain `cursor-e2e.whitecoats.com`
- **When** that tenant already exists
- **Then** the test opens its details and does not create another

### WC-SUP-01 Tenant list and a new tenant

**Sandbox.**

- **Given** the tenant list
- **Then** each hospital the platform owns is listed
- **When** Add Tenant is used without the required identity fields
- **Then** the tenant is not created
- **When** the required fields are valid
- **Then** the new tenant appears in the list and can sign in as hospital admin

### WC-SUP-02 Subscription and system health

**Sandbox.**

- **When** a tenant's plan is changed
- **Then** that hospital's feature access matches the new plan
- **When** System Health is opened
- **Then** the page loads service status without editing tenant data

## Cross-cutting

### WC-SEC-01 Anonymous visitors cannot open workspaces

**Automated** for the patient, doctor, staff, branch admin, hospital admin, sales, and super admin dashboards, plus booking, check-in, patient registration, billing, prescriptions, leads, and tenants.

- **Given** no session
- **When** one of those paths is opened
- **Then** the app redirects through `/login` to the marketing home
- **And** the not-found page is not used for these real routes

### WC-SEC-02 A signed-in role cannot open another role's home

**Sandbox.**

- **Given** a patient session
- **When** they open `/doctor/dashboard` or `/hospital-admin/dashboard`
- **Then** they are returned to `/patient/dashboard`
- **Given** a doctor session
- **When** they open `/super-admin/tenants`
- **Then** they are returned to `/doctor/dashboard`

### WC-SEC-03 Expired subscription and maintenance

**Sandbox.**

- **Given** a hospital whose subscription is expired
- **When** a hospital user signs in
- **Then** they are shown the subscription-expired screen instead of the dashboard
- **Given** the platform is in maintenance
- **Then** `/maintenance` is shown and booking is not available

### WC-SEC-04 Public suite never mutates accounts

**Automated** by the test fixture.

- **Given** any scenario in `tests/public`
- **Then** the run does not POST or PUT to sign-in, registration, password reset, OTP, or appointment endpoints
