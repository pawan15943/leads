<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\State;
use Illuminate\Database\Seeder;

class CountryStateCitySeeder extends Seeder
{
    public function run(): void
    {
        $india = Country::firstOrCreate(
            ['code' => 'IN'],
            ['name' => 'India', 'phone_code' => '+91', 'is_active' => true]
        );

        $statesData = $this->getAllIndianStatesAndCities();

        foreach ($statesData as $stateInfo) {
            $state = State::firstOrCreate(
                ['country_id' => $india->id, 'code' => $stateInfo['code']],
                ['name' => $stateInfo['name'], 'is_active' => true]
            );

            foreach ($stateInfo['cities'] as $cityName) {
                City::firstOrCreate(
                    ['state_id' => $state->id, 'name' => $cityName],
                    ['is_active' => true]
                );
            }
        }
    }

    private function getAllIndianStatesAndCities(): array
    {
        return [
            ['name' => 'Andhra Pradesh', 'code' => 'AP', 'cities' => ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Chittoor', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur', 'Proddatur']],
            ['name' => 'Arunachal Pradesh', 'code' => 'AR', 'cities' => ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Changlang', 'Tezu', 'Ziro', 'Bomdila', 'Tawang', 'Seppa', 'Roing', 'Khonsa', 'Yingkiong', 'Bordumsa', 'Nari']],
            ['name' => 'Assam', 'code' => 'AS', 'cities' => ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Karimganj', 'Goalpara', 'Sivasagar', 'Barpeta', 'Golaghat', 'Dhemaji', 'Nalbari', 'Kokrajhar', 'Haflong']],
            ['name' => 'Bihar', 'code' => 'BR', 'cities' => ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Saharsa', 'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar', 'Kishanganj']],
            ['name' => 'Chhattisgarh', 'code' => 'CG', 'cities' => ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund', 'Dhamtari', 'Chirmiri', 'Bhatapara', 'Dalli-Rajhara', 'Naila Janjgir', 'Tilda Newra', 'Mungeli', 'Manendragarh', 'Sakti', 'Kawardha']],
            ['name' => 'Goa', 'code' => 'GA', 'cities' => ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Quepem', 'Cuncolim', 'Canacona', 'Pernem', 'Sanguem', 'Valpoi', 'Aldona']],
            ['name' => 'Gujarat', 'code' => 'GJ', 'cities' => ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad', 'Vapi', 'Godhra', 'Navsari', 'Veraval']],
            ['name' => 'Haryana', 'code' => 'HR', 'cities' => ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Narnaul', 'Fatehabad']],
            ['name' => 'Himachal Pradesh', 'code' => 'HP', 'cities' => ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Kullu', 'Chamba', 'Una', 'Hamirpur', 'Bilaspur', 'Kangra', 'Dalhousie', 'Manali', 'Kasauli', 'Nalagarh', 'Sundarnagar', 'Arki', 'Rampur']],
            ['name' => 'Jharkhand', 'code' => 'JH', 'cities' => ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar', 'Chaibasa', 'Gumla', 'Dumka', 'Pakur', 'Godda', 'Sahebganj', 'Lohardaga', 'Jamtara', 'Koderma', 'Chatra']],
            ['name' => 'Karnataka', 'code' => 'KA', 'cities' => ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hospet', 'Hassan', 'Gadag', 'Chitradurga', 'Udupi', 'Chikmagalur', 'Karwar']],
            ['name' => 'Kerala', 'code' => 'KL', 'cities' => ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Kottayam', 'Pathanamthitta', 'Idukki', 'Ernakulam', 'Wayanad', 'Nilambur', 'Thalassery', 'Ponnani', 'Vatakara', 'Chalakudy']],
            ['name' => 'Madhya Pradesh', 'code' => 'MP', 'cities' => ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Damoh']],
            ['name' => 'Maharashtra', 'code' => 'MH', 'cities' => ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna']],
            ['name' => 'Manipur', 'code' => 'MN', 'cities' => ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Tamenglong', 'Jiribam', 'Moirang', 'Moreh', 'Yairipok', 'Mayang Imphal', 'Nambol', 'Wangjing']],
            ['name' => 'Meghalaya', 'code' => 'ML', 'cities' => ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Nongpoh', 'Williamnagar', 'Resubelpara', 'Mawkyrwat', 'Ampati', 'Baghmara', 'Mawphlang', 'Nongstoin', 'Mawlai', 'Laitlyngkot', 'Mawkyrwat']],
            ['name' => 'Mizoram', 'code' => 'MZ', 'cities' => ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Khawzawl', 'Saitual', 'Hnahthial', 'Saiha', 'Lawngtlai', 'Serchhip', 'Bairabi', 'Sairang']],
            ['name' => 'Nagaland', 'code' => 'NL', 'cities' => ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng', 'Peren', 'Chumukedima', 'Pfutsero', 'Tuli', 'Jalukie']],
            ['name' => 'Odisha', 'code' => 'OD', 'cities' => ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Jeypore', 'Bhawanipatna', 'Dhenkanal', 'Barbil', 'Jatani', 'Kendujhar', 'Rayagada', 'Jagatsinghpur', 'Paradip']],
            ['name' => 'Punjab', 'code' => 'PB', 'cities' => ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Faridkot', 'Sangrur', 'Fazilka']],
            ['name' => 'Rajasthan', 'code' => 'RJ', 'cities' => ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Dhaulpur', 'Gangapur', 'Sawai Madhopur', 'Churu']],
            ['name' => 'Sikkim', 'code' => 'SK', 'cities' => ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Ravangla', 'Rangpo', 'Jorethang', 'Pelling', 'Yuksom', 'Lachung', 'Lachen', 'Rongli', 'Chungthang', 'Melli', 'Singtam']],
            ['name' => 'Tamil Nadu', 'code' => 'TN', 'cities' => ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Ranipet', 'Nagercoil', 'Thanjavur', 'Vellore', 'Kancheepuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Gudalur', 'Sankarankovil', 'Tenkasi', 'Kumbakonam']],
            ['name' => 'Telangana', 'code' => 'TS', 'cities' => ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Miryalaguda', 'Sangareddy', 'Vikarabad', 'Wanaparthy', 'Mancherial', 'Nirmal', 'Bodhan', 'Jagtial', 'Sircilla']],
            ['name' => 'Tripura', 'code' => 'TR', 'cities' => ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Ambassa', 'Belonia', 'Khowai', 'Sabroom', 'Bishalgarh', 'Teliamura', 'Amarpur', 'Ranirbazar', 'Sonamura', 'Kumarghat', 'Melaghar']],
            ['name' => 'Uttar Pradesh', 'code' => 'UP', 'cities' => ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad']],
            ['name' => 'Uttarakhand', 'code' => 'UK', 'cities' => ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Ramnagar', 'Mussoorie', 'Almora', 'Nainital', 'Tehri', 'Pauri', 'Champawat', 'Bageshwar', 'Uttarkashi', 'Chakrata', 'Lansdowne', 'Laksar']],
            ['name' => 'West Bengal', 'code' => 'WB', 'cities' => ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Balurghat']],
            // Union Territories
            ['name' => 'Andaman and Nicobar Islands', 'code' => 'AN', 'cities' => ['Port Blair', 'Diglipur', 'Rangat', 'Mayabunder', 'Car Nicobar', 'Nancowry', 'Little Andaman', 'Hut Bay', 'Bamboo Flat', 'Garacharma']],
            ['name' => 'Chandigarh', 'code' => 'CH', 'cities' => ['Chandigarh', 'Manimajra', 'Sector 17', 'Panchkula', 'Mohali']],
            ['name' => 'Dadra and Nagar Haveli and Daman and Diu', 'code' => 'DD', 'cities' => ['Silvassa', 'Daman', 'Diu', 'Naroli', 'Rakholi', 'Amli', 'Khanvel', 'Vapi', 'Kachigam', 'Moti Daman']],
            ['name' => 'Delhi', 'code' => 'DL', 'cities' => ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Connaught Place', 'Lajpat Nagar', 'Paharganj', 'Chandni Chowk', 'Janakpuri']],
            ['name' => 'Jammu and Kashmir', 'code' => 'JK', 'cities' => ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Kupwara', 'Budgam', 'Bandipora', 'Ganderbal', 'Pulwama', 'Shopian', 'Kulgam', 'Rajouri']],
            ['name' => 'Ladakh', 'code' => 'LA', 'cities' => ['Leh', 'Kargil', 'Nubra', 'Zanskar', 'Drass', 'Padum', 'Diskit', 'Panamik', 'Sankoo', 'Turtuk']],
            ['name' => 'Lakshadweep', 'code' => 'LD', 'cities' => ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott', 'Kadmat', 'Kiltan', 'Chetlat', 'Bitra', 'Kalpeni']],
            ['name' => 'Puducherry', 'code' => 'PY', 'cities' => ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Ozhukarai', 'Villianur', 'Ariankuppam', 'Nettapakkam', 'Kurumbapet', 'Sedarapet']],
        ];
    }
}
